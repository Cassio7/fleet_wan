import { Injectable } from '@nestjs/common';
import { getDaysInRange, validateDateRangeNoZ } from 'src/utils/utils';
import { SessionService } from '../session/session.service';
import { TagService } from '../tag/tag.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { ConfigService } from '@nestjs/config';
import { VehicleEntity } from 'classes/entities/vehicle.entity';

@Injectable()
export class ControlService {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly sessionService: SessionService,
    private readonly tagService: TagService,
    private configService: ConfigService,
  ) {}

  // in base al numero calcolo n min_position * 30 secondi = min tempo che deve aver percorso per essere valida una giornata
  private MIN_POSITIONS_GPS =
    this.configService.get<number>('MIN_POSITIONS_GPS');
  // percentuale sopra al 20%
  private PERCENTUALE_GPS = 0.2;
  // massima distanza che può fare una sessione
  private MAX_DISTANCE: number = this.configService.get<number>('MAX_DISTANCE');
  // minimo 1 posizione per convalidare una sessione
  private MIN_POSITIONS_ANTENNA = this.configService.get<number>(
    'MIN_POSITIONS_ANTENNA',
  );
  // un giorno
  private TIME_DELAY_OPEN = 3 * 60 * 1000;

  /**
   * Controllo tutte le sessioni di tutti i veicoli, per marcare quelle con dei malfunzionamenti al GPS
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @param vehicles lista veicoli
   * @returns
   */
  async checkGPS(
    dateFrom: Date,
    dateTo: Date,
    vehicles: VehicleEntity[],
  ): Promise<any> {
    const validation = validateDateRangeNoZ(
      dateFrom.toISOString(),
      dateTo.toISOString(),
    );
    if (!validation.isValid) {
      return validation.message;
    }

    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);

    const anomaliesForDays = await Promise.all(
      daysInRange.slice(0, -1).map(async (day) => {
        const startOfDay = new Date(day);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 0);

        const vehicleIds = vehicles.map((v) => v.veId);

        // Recupera tutte le sessioni in un'unica chiamata per il giorno corrente
        const sessionMap =
          await this.sessionService.getAllSessionsByVeIdsAndRange(
            vehicleIds,
            startOfDay,
            endOfDay,
          );
        return vehicles.map((vehicle) => {
          const sessionsDay = sessionMap.get(vehicle.veId) || [];
          if (sessionsDay.length === 0) {
            return null;
          }

          const coordinates = sessionsDay.map((data) => ({
            latitude: data.latitude,
            longitude: data.longitude,
          }));

          if (coordinates.length < this.MIN_POSITIONS_GPS) {
            return null;
          }

          const anomalies = [];
          const isCoordinatesFixed = coordinates.every(
            (coord) =>
              coord.latitude === coordinates[0].latitude &&
              coord.longitude === coordinates[0].longitude,
          );

          const zeroCoordinatesCount = coordinates.filter(
            (coord) => coord.latitude === 0 && coord.longitude === 0,
          ).length;
          const hasZeroCoordinatesAnomaly =
            zeroCoordinatesCount > coordinates.length * this.PERCENTUALE_GPS;

          const groupedBySequence = sessionsDay.reduce((acc, item) => {
            acc[item.sequence_id] = acc[item.sequence_id] || [];
            acc[item.sequence_id].push(item);
            return acc;
          }, {});

          const skipDistanceCheck =
            Object.keys(groupedBySequence).length === 1 &&
            groupedBySequence[0]?.length > 0;
          let distanceTooBig: boolean = false;
          if (!skipDistanceCheck) {
            // recupero tutte le distanze soltanto 1 volta, per ogni sessione
            const uniqueDistances: number[] = Array.from(
              sessionsDay
                .reduce((map, item) => {
                  if (!map.has(item.sequence_id)) {
                    map.set(item.sequence_id, item.distance);
                  }
                  return map;
                }, new Map<number, number>())
                .values(),
            );
            if (vehicle.isCan) {
              const hasDistanceAnomaly = uniqueDistances.every(
                (distance) => distance === 0,
              );
              if (hasDistanceAnomaly) {
                anomalies.push(
                  `Anomalia tachimetro, distanza sempre uguale a ${uniqueDistances[0]}`,
                );
              }
            } else {
              const hasDistanceAnomaly =
                uniqueDistances.every(
                  (distance) => distance === uniqueDistances[0],
                ) || uniqueDistances.every((distance) => distance === 0);
              if (hasDistanceAnomaly && isCoordinatesFixed) {
                anomalies.push(
                  `Anomalia totale, distanza: ${uniqueDistances[0]} e lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
                );
                return {
                  plate: vehicle.plate,
                  veId: vehicle.veId,
                  isCan: vehicle.isCan,
                  isRFIDReader: vehicle.allestimento,
                  day,
                  anomalies,
                };
              }
              distanceTooBig = uniqueDistances.some(
                (distance) => distance > this.MAX_DISTANCE,
              );
            }
          }

          if (isCoordinatesFixed) {
            anomalies.push(
              `Anomalia coordinate, sempre uguali a lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
            );
          } else if (hasZeroCoordinatesAnomaly) {
            anomalies.push(
              `Anomalia coordinate con lat: 0 e lon: 0 sopra al 20%`,
            );
          } else if (distanceTooBig) {
            anomalies.push(
              `Anomalia distanza: sessione superiore a ${this.MAX_DISTANCE}km `,
            );
          }

          return {
            plate: vehicle.plate,
            veId: vehicle.veId,
            isCan: vehicle.isCan,
            isRFIDReader: vehicle.allestimento,
            day,
            anomalies,
          };
        });
      }),
    );

    const vehicleMap = new Map();
    anomaliesForDays
      .flat()
      .filter((item) => item !== null && item !== undefined)
      .forEach((item) => {
        if (!vehicleMap.has(item.veId)) {
          vehicleMap.set(item.veId, {
            plate: item.plate,
            veId: item.veId,
            isCan: item.isCan,
            isRFIDReader: item.isRFIDReader,
            sessions: [],
          });
        }

        vehicleMap.get(item.veId).sessions.push({
          date: item.day,
          anomalies: item.anomalies,
        });
      });

    return Array.from(vehicleMap.values());
  }

  /**
   * Controlla se esistono anomalie nella lettura di una tag, fa il controllo tra l'ultima lettura e le sessioni
   * @param dateFrom data di inizio periodo
   * @param dateTo data di fine periodo
   * @returns
   */
  private async checkAntenna(dateFrom: Date, dateTo: Date) {
    const validation = validateDateRangeNoZ(
      dateFrom.toISOString(),
      dateTo.toISOString(),
    );
    if (!validation.isValid) {
      return validation.message;
    }

    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const allVehicles = await this.vehicleService.getVehiclesByReader();
    const vehicleIds = allVehicles.map((v) => v.veId);

    const anomaliesForDays = await Promise.all(
      daysInRange.slice(0, -1).map(async (day) => {
        const startOfDay = new Date(day);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 0);

        const tagMap = await this.tagService.getLastTagHistoryByVeIdsAndRange(
          vehicleIds,
          startOfDay,
          endOfDay,
        );
        const sessionMap =
          await this.sessionService.getAllSessionsByVeIdsAndRange(
            vehicleIds,
            startOfDay,
            endOfDay,
          );
        return allVehicles.map((vehicle) => {
          const lastTag = tagMap.get(vehicle.veId) || null;

          const sessionsDay = sessionMap.get(vehicle.veId) || [];

          // raggruppo tutti le posizioni per la loro key della sessione corrispondente
          const groupedBySequence = sessionsDay.reduce((acc, item) => {
            acc[item.key] = acc[item.key] || [];
            acc[item.key].push(item);
            return acc;
          }, {});

          // numero posizioni minime = 1 per ogni sessione
          const filteredSessions = Object.values(groupedBySequence).filter(
            (group: any) => group.length >= this.MIN_POSITIONS_ANTENNA,
          );

          // se nessun tag e sessione trovata stop ricerca
          if (!lastTag && filteredSessions?.length === 0) {
            return null;
          }
          const anomalies = [];
          if (!lastTag && filteredSessions?.length > 0) {
            anomalies.push('Sessioni trovate ma no tag letti.');
          }
          if (lastTag && filteredSessions?.length === 0) {
            anomalies.push('Tag letto ma nessuna sessione trovata.');
          }

          return {
            plate: vehicle.plate,
            veId: vehicle.veId,
            isCan: vehicle.isCan,
            isRFIDReader: vehicle.allestimento,
            day,
            anomalies,
          };
        });
      }),
    );

    const vehicleMap = new Map();
    anomaliesForDays
      .flat()
      .filter((item) => item !== null && item !== undefined) // Filtra valori null o undefined
      .forEach((item) => {
        if (!vehicleMap.has(item.veId)) {
          vehicleMap.set(item.veId, {
            plate: item.plate,
            veId: item.veId,
            isCan: item.isCan,
            isRFIDReader: item.isRFIDReader,
            sessions: [],
          });
        }

        vehicleMap.get(item.veId).sessions.push({
          date: item.day,
          anomalies: item.anomalies, // Manteniamo anche le anomalie vuote
        });
      });

    return Array.from(vehicleMap.values());
  }

  /**
   * Ritorna tutti i veicoli dove la data dell'ultima sessione non corrisponde all ultimo evento registrato, inserendo sessione nulla
   * @param vehicles lista veicoli
   * @returns
   */
  private async checkSession(vehicles: VehicleEntity[]) {
    try {
      const vehicleIds = vehicles.map((v) => v.veId);

      // Recupero le ultime sessioni per tutti i veicoli in parallelo
      let sessionsMap =
        await this.sessionService.getLastValidSessionRedis(vehicleIds);
      if (!sessionsMap || sessionsMap.size === 0)
        sessionsMap =
          await this.sessionService.getLastValidSessionByVeIds(vehicleIds);
      const brokenVehicles = vehicles.reduce((acc, vehicle) => {
        const lastSession = sessionsMap.get(vehicle.veId) || null;
        if (lastSession) {
          // ultimo evento del veicolo che corrisponde a ultima posizione su una sessione valida
          const lastVehicleEventTime = new Date(vehicle.lastEvent).getTime();
          const sessionEndTime = new Date(lastSession.period_to).getTime();

          if (lastVehicleEventTime > sessionEndTime) {
            acc.push({
              plate: vehicle.plate,
              veId: vehicle.veId,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.allestimento,
              anomalies: 'Presente una sessione nulla',
            });
          }
        }
        return acc;
      }, []);

      return brokenVehicles.length > 0 ? brokenVehicles : false;
    } catch (error) {
      console.error('Error getting last event: ', error);
      return 'Errore durante la richiesta al db'; // Return error message as string
    }
  }

  /**
   * Controlla se è presente una sessione aperta e se i dati sono bloccati
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @param vehicles lista veicoli
   * @returns
   */
  private async checkOpenSession(
    dateFrom: Date,
    dateTo: Date,
    vehicles: VehicleEntity[],
  ) {
    const validation = validateDateRangeNoZ(
      dateFrom.toISOString(),
      dateTo.toISOString(),
    );
    if (!validation.isValid) {
      return validation.message;
    }

    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const vehicleIds = vehicles.map((v) => v.veId);

    // Recupero le ultime sessioni per tutti i veicoli in parallelo
    let historyMap = await this.sessionService.getLastHistoryRedis(vehicleIds);
    if (!historyMap || historyMap.size === 0)
      historyMap = await this.sessionService.getLastHistoryByVeIds(vehicleIds);
    const openForDays = await Promise.all(
      daysInRange.slice(0, -1).map(async (day) => {
        const startOfDay = new Date(day);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 0);
        const sessionMap =
          await this.sessionService.getAllSessionsByVeIdsAndRange(
            vehicleIds,
            startOfDay,
            endOfDay,
          );
        return vehicles.map((vehicle) => {
          const sessionsDay = sessionMap.get(vehicle.veId) || [];
          if (!Array.isArray(sessionsDay) || sessionsDay.length === 0) {
            return null;
          }
          const anomalies = [];

          if (sessionsDay.every((session) => session.sequence_id === 0)) {
            const lastTimestamp = historyMap.get(vehicle.veId);

            if (
              lastTimestamp &&
              new Date(lastTimestamp.timestamp).getTime() +
                this.TIME_DELAY_OPEN >
                new Date(vehicle.lastEvent).getTime()
            ) {
              const isToday =
                new Date(lastTimestamp.timestamp).toDateString() ===
                new Date().toDateString();
              anomalies.push(
                `Sessione rimasta aperta: ${isToday ? 'Problema alimentazione' : 'Dati bloccati'}`,
              );
            } else {
              anomalies.push('Sessione rimasta aperta');
            }
          }
          return {
            plate: vehicle.plate,
            veId: vehicle.veId,
            isCan: vehicle.isCan,
            isRFIDReader: vehicle.allestimento,
            day,
            anomalies,
          };
        });
      }),
    );
    const vehicleMap = new Map();
    openForDays
      .flat()
      .filter((item) => item !== null && item !== undefined)
      .forEach((item) => {
        if (!vehicleMap.has(item.veId)) {
          vehicleMap.set(item.veId, {
            plate: item.plate,
            veId: item.veId,
            isCan: item.isCan,
            isRFIDReader: item.isRFIDReader,
            sessions: [],
          });
        }

        vehicleMap.get(item.veId).sessions.push({
          date: item.day,
          anomalies: item.anomalies, // Manteniamo anche le anomalie vuote
        });
      });
    return Array.from(vehicleMap.values());
  }

  private async checkQuality(dateFrom: Date, dateTo: Date) {
    const validation = validateDateRangeNoZ(
      dateFrom.toISOString(),
      dateTo.toISOString(),
    );
    if (!validation.isValid) {
      return validation.message;
    }

    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const allVehicles = await this.vehicleService.getVehiclesByReader();
    const vehicleIds = allVehicles.map((v) => v.veId);
    const qualityForDays = await Promise.all(
      daysInRange.slice(0, -1).map(async (day) => {
        const startOfDay = new Date(day);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 0);

        const tags = await this.tagService.noAPIgetTagHistoryByVeIdRanged(
          vehicleIds,
          startOfDay,
          endOfDay,
        );
        return allVehicles.map((vehicle) => {
          const detections = tags.get(vehicle.veId) || [];
          if (detections.length === 0) {
            return null;
          }
          let detection_qualityText: string = null;
          // controlla se esiste almeno una lettura con valore -70 o maggiore -71 ...
          const detectionsBad = detections.some((num) => num <= -70);
          if (detectionsBad) {
            detection_qualityText = 'Poor: un tag con -70 o superiore';
          } else {
            // controlla se il 50% delle letture ha valore ugale a -60 o maggiore -61 ...
            const detectionsOk = detections.filter((num) => num <= -60).length;
            const isFiftyPercentBad = detectionsOk >= detections.length / 2;
            detection_qualityText = isFiftyPercentBad
              ? 'Good: range -60 -69'
              : 'Excellent: range 0 -59';
          }
          return {
            plate: vehicle.plate,
            veId: vehicle.veId,
            isCan: vehicle.isCan,
            isRFIDReader: vehicle.allestimento,
            day,
            detection_quality: detection_qualityText,
          };
        });
      }),
    );
    const vehicleMap = new Map();
    qualityForDays
      .flat()
      .filter((item) => item !== null && item !== undefined) // Filtra valori null o undefined
      .forEach((item) => {
        if (!vehicleMap.has(item.veId)) {
          vehicleMap.set(item.veId, {
            plate: item.plate,
            veId: item.veId,
            isCan: item.isCan,
            isRFIDReader: item.isRFIDReader,
            detection_quality: [],
          });
        }
        vehicleMap.get(item.veId).detection_quality.push({
          date: item.day,
          anomalies: item.detection_quality, // Manteniamo anche le anomalie vuote
        });
      });
    return Array.from(vehicleMap.values())
      .map((vehicle) => {
        // Filtra detection_quality eliminando quelli con anomalies = null
        const filteredQuality = vehicle.detection_quality.filter(
          (dq) => dq.anomalies !== null,
        );

        // Ritorna il veicolo solo se detection_quality non è vuoto
        if (filteredQuality.length > 0) {
          return {
            ...vehicle,
            detection_quality: filteredQuality, // Sovrascrivi con la lista filtrata
          };
        }
        // Se detection_quality è vuoto, non ritorniamo il veicolo
        return null;
      })
      .filter((vehicle) => vehicle !== null); // Rimuovi i veicoli nulli
  }
  /**
   * Funzione principale che accorpa tutti i controlli, divisa per giorni
   * @param dateFromParam data di inizio
   * @param dateToParam data do fome
   * @returns ritorna false oppure un oggetto con tutte le anomalie divise per veicolo, data e tipologia
   */
  async checkErrors(dateFromParam: string, dateToParam: string) {
    const dateFrom = new Date(dateFromParam);
    const dateTo = new Date(dateToParam);

    let gpsErrors: any = []; // Risultati controllo GPS
    let fetchedTagComparisons: any = []; // Risultati comparazione tag
    let comparison: any = []; // Controllo errori lastEvent
    let openSession: any = []; // Controllo errori Sessione aperta
    let quality: any = []; // Controllo errori detection_quality
    const mergedData = [];

    // recupero tutti i veicoli
    const allVehicles = await this.vehicleService.getActiveVehicles();

    // Controlla errore di GPS
    try {
      gpsErrors = await this.checkGPS(dateFrom, dateTo, allVehicles);
      gpsErrors = Array.isArray(gpsErrors) ? gpsErrors : [];
    } catch (error) {
      console.error('Errore nel controllo errori del GPS:', error);
    }

    // Controlla errore Antenna
    try {
      fetchedTagComparisons = await this.checkAntenna(dateFrom, dateTo);
      fetchedTagComparisons = Array.isArray(fetchedTagComparisons)
        ? fetchedTagComparisons
        : [];
    } catch (error) {
      console.error(
        'Errore nella comparazione dei tag per controllare gli errori delle antenne:',
        error,
      );
    }

    try {
      quality = await this.checkQuality(dateFrom, dateTo);
      quality = Array.isArray(quality) ? quality : [];
    } catch (error) {
      console.error(
        'Errore nella media dei detection quality giornalieri:',
        error,
      );
    }
    // Controlla errore inizio e fine sessione (last event)
    try {
      comparison = await this.checkSession(allVehicles);
      comparison = Array.isArray(comparison) ? comparison : [];
    } catch (error) {
      console.error('Errore nel controllo del last event:', error);
    }

    try {
      openSession = await this.checkOpenSession(dateFrom, dateTo, allVehicles);
      openSession = Array.isArray(openSession) ? openSession : [];
    } catch (error) {
      console.error('Errore nel controllo della sessione aperta:', error);
    }
    // Combina i risultati
    try {
      const allPlates = new Set([
        ...gpsErrors.map((item) => item.plate),
        ...fetchedTagComparisons.map((item) => item.plate),
        ...quality.map((item) => item.plate),
        ...openSession.map((item) => item.plate),
        ...comparison.map((item) => item.plate),
      ]);

      allPlates.forEach((plate) => {
        const gpsEntry = gpsErrors.find((item) => item.plate === plate) || {};
        const tagEntry =
          fetchedTagComparisons.find((item) => item.plate === plate) || {};
        const qualityEntry = quality.find((item) => item.plate === plate) || {};
        const openSessionEntry =
          openSession.find((item) => item.plate === plate) || {};
        const comparisonEntry =
          comparison.find((item) => item.plate === plate) || {};

        // Combina tutte le sessioni in base alla data
        const allSessions = new Map();

        // Aggiungi sessioni GPS
        (gpsEntry.sessions || []).forEach((session) => {
          if (!allSessions.has(session.date)) {
            allSessions.set(session.date, {
              date: session.date,
              anomalies: {},
            });
          }
          allSessions.get(session.date).anomalies.GPS = session.anomalies?.[0];
        });

        // Aggiungi sessioni Antenna
        (tagEntry.sessions || []).forEach((session) => {
          if (!allSessions.has(session.date)) {
            allSessions.set(session.date, {
              date: session.date,
              anomalies: {},
            });
          }
          allSessions.get(session.date).anomalies.Antenna =
            session.anomalies?.[0];
        });

        // Aggiungi qualità Antenna
        (qualityEntry.detection_quality || []).forEach((session) => {
          if (!allSessions.has(session.date)) {
            allSessions.set(session.date, {
              date: session.date,
              anomalies: {},
            });
          }
          allSessions.get(session.date).anomalies.detection_quality =
            session.anomalies;
        });

        // Aggiungi sessioni aperte
        (openSessionEntry.sessions || []).forEach((session) => {
          if (!allSessions.has(session.date)) {
            allSessions.set(session.date, {
              date: session.date,
              anomalies: {},
            });
          }
          allSessions.get(session.date).anomalies.open = session.anomalies?.[0];
        });
        const combinedMap = new Map();

        allSessions.forEach((value, key) => {
          // Usando toISOString per avere una chiave comparabile
          const dateKey = key.toISOString();

          if (combinedMap.has(dateKey)) {
            // Se la data è già presente, combiniamo le anomalie
            const existingValue = combinedMap.get(dateKey);
            existingValue.anomalies = {
              ...existingValue.anomalies,
              ...value.anomalies,
            };
            combinedMap.set(dateKey, existingValue);
          } else {
            // Se la data non esiste, la aggiungiamo
            combinedMap.set(dateKey, value);
          }
        });

        // Trasforma le sessioni in array unificando le anomalie per ciascuna data
        const unifiedSessions = Array.from(combinedMap.values());
        unifiedSessions.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        mergedData.push({
          plate,
          veId:
            gpsEntry.veId ||
            tagEntry.veId ||
            comparisonEntry.veId ||
            qualityEntry.veId ||
            openSessionEntry.veId ||
            null,
          isCan:
            gpsEntry.isCan ||
            tagEntry.isCan ||
            comparisonEntry.isCan ||
            qualityEntry.isCan ||
            openSessionEntry.isCan ||
            false,
          isRFIDReader:
            gpsEntry.isRFIDReader ||
            tagEntry.isRFIDReader ||
            comparisonEntry.isRFIDReader ||
            qualityEntry.isRFIDReader ||
            openSessionEntry.isRFIDReader ||
            false,
          anomaliaSessione: comparisonEntry.anomalies,
          sessions: unifiedSessions,
        });
      });

      mergedData.sort((a, b) => a.plate.localeCompare(b.plate));
    } catch (error) {
      console.error(
        'Errore nella formattazione della risposta per le anomalie:',
        error,
      );
    }
    if (mergedData.length > 0) return mergedData;
    else return false;
  }
}
