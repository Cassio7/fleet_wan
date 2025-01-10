import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AnomalyEntity } from 'classes/entities/anomaly.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import { Between, DataSource, In, Repository } from 'typeorm';
import { SessionService } from '../session/session.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { TagService } from '../tag/tag.service';
import { getDaysInRange, validateDateRange } from 'src/utils/utils';
import { SessionEntity } from 'classes/entities/session.entity';
import { TagHistoryEntity } from 'classes/entities/tag_history.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { AnomalyDTO } from 'classes/dtos/anomaly.dto';
import { VehicleDTO } from 'classes/dtos/vehicle.dto';
import { WorksiteDTO } from 'classes/dtos/worksite.dto';

@Injectable()
export class AnomalyService {
  constructor(
    @InjectRepository(AnomalyEntity, 'readOnlyConnection')
    private readonly anomalyRepository: Repository<AnomalyEntity>,
    @InjectRepository(VehicleEntity, 'readOnlyConnection')
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly sessionService: SessionService,
    private readonly tagService: TagService,
    private readonly vehicleService: VehicleService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  /**
   * Recupera tutte le anomalie salvate
   */
  async getAllAnomalyByVeId(veId: number[] | number): Promise<any> {
    const veIdArray = Array.isArray(veId) ? veId : [veId];
    const anomalies = await this.anomalyRepository.find({
      where: {
        vehicle: {
          veId: In(veIdArray),
        },
      },
      relations: {
        vehicle: {
          worksite: true,
        },
      },
      order: {
        vehicle: {
          plate: 'ASC',
        },
      },
    });
    return this.toDTO(anomalies);
  }

  /**
   * Recupera le anomalia piu recente per ogni veicolo passato come parametro, escludendo
   * la data odierna
   * @param veId id dei veicoli
   * @returns
   */
  async getLastAnomaly(veId: number[] | number): Promise<any> {
    const veIdArray = Array.isArray(veId) ? veId : [veId];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Recupero le ultime 2 anomalie per ogni veicolo
    const anomalies = await this.anomalyRepository
      .createQueryBuilder('anomalies')
      .innerJoinAndSelect('anomalies.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.worksite', 'worksite')
      .where('vehicle.veId IN (:...veIdArray)', { veIdArray })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('a2.date')
          .from('anomalies', 'a2')
          .where('a2.vehicleId = anomalies.vehicleId')
          .orderBy('a2.date', 'DESC')
          .limit(2)
          .getQuery();
        return `anomalies.date IN (${subQuery})`;
      })
      .orderBy('vehicle.plate', 'ASC')
      .addOrderBy('anomalies.date', 'DESC')
      .getMany();

    // Raggruppo le anomalie per veicolo
    const groupedAnomalies = anomalies.reduce(
      (acc, anomaly) => {
        const vehicleId = anomaly.vehicle.id;
        if (!acc[vehicleId]) {
          acc[vehicleId] = [];
        }
        acc[vehicleId].push(anomaly);
        return acc;
      },
      {} as Record<number, AnomalyEntity[]>,
    );

    // Recupero l'anomalia piu recente, senza recuperare l'ordierna
    const filteredAnomalies = Object.values(groupedAnomalies)
      .map((vehicleAnomalies) => {
        if (vehicleAnomalies.length === 0) return null;

        const [latest, previous] = vehicleAnomalies;

        // Se la piu recente è di oggi, prendo la precedente
        if (latest.date.getTime() === today.getTime() && previous) {
          return previous;
        }

        return latest;
      })
      .filter(Boolean);

    return this.toDTO(filteredAnomalies);
  }

  /**
   * Restituisce le anomalie in base ai veid inseriti e in base al giorno
   * @param veId Id dei veicoli
   * @param date data da controllare
   * @returns
   */
  async getAnomalyByDate(veId: number[] | number, date: Date): Promise<any> {
    const veIdArray = Array.isArray(veId) ? veId : [veId];
    date.setHours(0, 0, 0, 0);
    const anomalies = await this.anomalyRepository.find({
      where: {
        vehicle: {
          veId: In(veIdArray),
        },
        date: date,
      },
      relations: {
        vehicle: {
          worksite: true,
        },
      },
      order: {
        vehicle: {
          plate: 'ASC',
        },
      },
    });

    return this.toDTO(anomalies);
  }

  /**
   * Restituisce le anomalie in base al range temporale di inserimento
   * @param veId id dei veicoli da recuperare
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns
   */
  async getAnomalyByDateRange(
    veId: number[] | number,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any> {
    const veIdArray = Array.isArray(veId) ? veId : [veId];
    dateFrom.setHours(0, 0, 0, 0);
    dateTo.setHours(0, 0, 0, 0);
    const anomalies = await this.anomalyRepository.find({
      where: {
        vehicle: {
          veId: In(veIdArray),
        },
        date: Between(dateFrom, dateTo),
      },
      relations: {
        vehicle: {
          worksite: true,
        },
      },
      order: {
        vehicle: {
          plate: 'ASC',
        },
      },
    });
    return this.toDTO(anomalies);
  }
  /**
   * Imposta le anomalie di ieri su Redis per recupero veloce
   * @param anomalies
   */
  async setDayBeforeAnomalyRedis(anomalies: any) {
    for (const anomaly of anomalies) {
      const key = `dayBeforeAnomaly:${anomaly.vehicle.veId}`;
      await this.redis.set(key, JSON.stringify(anomaly));
    }
    return true;
  }
  /**
   * Imposta anomalie di oggi su Redis per recupero veloce
   * @param anomalies
   */
  async setTodayAnomalyRedis(anomalies: any) {
    for (const anomaly of anomalies) {
      const key = `todayAnomaly:${anomaly.vehicle.veId}`;
      await this.redis.set(key, JSON.stringify(anomaly));
    }
    const key = `todayAnomaly:lastUpdate`;
    await this.redis.set(key, new Date().toISOString());
    return true;
  }
  /**
   * imposta le ultime anomalie su Redis per un recupero veloce
   * @param anomalies
   * @returns
   */
  async setLastAnomalyRedis(anomalies: any) {
    for (const anomaly of anomalies) {
      const key = `lastAnomaly:${anomaly.vehicle.veId}`;
      await this.redis.set(key, JSON.stringify(anomaly));
    }
    return true;
  }
  /**
   * Funzione per creare una anomalia, in base ai dati passati come parametro, vengono salvate
   * pure le anomalie nulle per indicare che il mezzo ha lavorato
   * @param veId veId identificativo del veicolo
   * @param date data dell'anomalia
   * @param gps anomalia gps
   * @param antenna anomalia antenna
   * @param session anomalia sessione
   * @returns
   */
  async createAnomaly(
    veId: number,
    date: Date,
    gps: string | null,
    antenna: string | null,
    session: string | null,
  ) {
    const normalizeField = (field: string | null): string | null =>
      field && field.trim() !== '' ? field : null;

    const normalizedGps = normalizeField(gps);
    const normalizedAntenna = normalizeField(antenna);
    const normalizedSession = normalizeField(session);
    let day = date;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (day === null) {
      day = today;
    }
    const hashAnomaly = (): string => {
      const toHash = {
        veId: veId,
        date: day,
        gps: normalizedGps,
        antenna: normalizedAntenna,
      };
      return createHash('sha256').update(JSON.stringify(toHash)).digest('hex');
    };
    const vehicle = await this.vehicleRepository.findOne({
      where: {
        veId: veId,
      },
    });
    if (!vehicle) {
      return false;
    }

    const queryRunner = this.connection.createQueryRunner();
    try {
      const hash = hashAnomaly();
      const anomaliesQuery = await this.anomalyRepository.findOne({
        where: {
          date: day,
          vehicle: {
            veId: veId,
          },
        },
      });
      await queryRunner.connect();
      await queryRunner.startTransaction();
      if (anomaliesQuery && anomaliesQuery.hash !== hash) {
        if (day.getTime() === today.getTime()) {
          const anomaly = {
            vehicle: vehicle,
            date: day,
            session: normalizedSession,
            gps: normalizedGps,
            antenna: normalizedAntenna,
            hash: hash,
          };
          await queryRunner.manager
            .getRepository(AnomalyEntity)
            .update({ key: anomaliesQuery.key }, anomaly);
        } else {
          const anomaly = {
            vehicle: vehicle,
            date: day,
            gps: normalizedGps,
            antenna: normalizedAntenna,
            hash: hash,
          };
          await queryRunner.manager
            .getRepository(AnomalyEntity)
            .update({ key: anomaliesQuery.key }, anomaly);
        }
      } else if (!anomaliesQuery) {
        const anomaly = await queryRunner.manager
          .getRepository(AnomalyEntity)
          .create({
            vehicle: vehicle,
            date: day,
            session: normalizedSession,
            gps: normalizedGps,
            antenna: normalizedAntenna,
            hash: hash,
          });
        await queryRunner.manager.getRepository(AnomalyEntity).save(anomaly);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nel inserimento nuova anomalia: ' + error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Controllo tutte le sessioni di tutti i veicoli, per marcare quelle con dei malfunzionamenti al GPS
   * @param dateFrom Data inizio ricerca
   * @param dateTo Data fine ricerca
   * @returns
   */
  async checkGPS(dateFrom: Date, dateTo: Date) {
    const validation = validateDateRange(
      dateFrom.toISOString(),
      dateTo.toISOString(),
    );
    if (!validation.isValid) {
      return validation.message;
    }

    const daysInRange = getDaysInRange(new Date(dateFrom), new Date(dateTo));
    const vehicles = await this.vehicleService.getAllVehicles();

    const resultsForAllVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        const vehicleCheck = {
          plate: vehicle.plate,
          veId: vehicle.veId,
          isCan: vehicle.isCan,
          isRFIDReader: vehicle.isRFIDReader,
          sessions: [],
        };

        const sessionsForVehicle = await Promise.all(
          daysInRange.slice(0, -1).map(async (day) => {
            const dateto = new Date(day);
            dateto.setHours(23, 59, 59, 0);

            const datas = await this.sessionService.getAllSessionByVeIdRanged(
              vehicle.veId,
              day,
              dateto,
            );
            if (datas.length === 0) return null;

            const coordinates = datas.flatMap((data) =>
              data.history.map((entry) => ({
                latitude: entry.latitude,
                longitude: entry.longitude,
              })),
            );

            if (coordinates.length <= 4) return null;

            const session = {
              date: day,
              anomalies: [],
            };

            // Check coordinates anomalies
            const isCoordinatesFixed = coordinates.every(
              (coord) =>
                coord.latitude === coordinates[0].latitude &&
                coord.longitude === coordinates[0].longitude,
            );

            const zeroCoordinatesCount = coordinates.filter(
              (coord) => coord.latitude === 0 && coord.longitude === 0,
            ).length;
            const hasZeroCoordinatesAnomaly =
              zeroCoordinatesCount > coordinates.length * 0.2;

            // Skip distance check only for specific condition
            const skipDistanceCheck =
              datas.length === 1 && datas[0].sequence_id === 0;

            if (!skipDistanceCheck) {
              const distanceMap = datas.map((data) => data.distance);

              if (vehicle.isCan) {
                const hasDistanceAnomaly = distanceMap.every(
                  (distance) => distance === 0,
                );
                if (hasDistanceAnomaly) {
                  session.anomalies.push(
                    `Anomalia tachimetro, distanza sempre uguale a ${distanceMap[0]}`,
                  );
                }
              } else {
                const hasDistanceAnomaly =
                  distanceMap.every(
                    (distance) => distance === distanceMap[0],
                  ) || distanceMap.every((distance) => distance === 0);

                if (hasDistanceAnomaly && isCoordinatesFixed) {
                  session.anomalies.push(
                    `Anomalia totale, distanza: ${distanceMap[0]} e lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
                  );
                  return session;
                }
              }
            }

            // Add coordinate-related anomalies
            if (isCoordinatesFixed) {
              session.anomalies.push(
                `Anomalia coordinate, sempre uguali a lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
              );
            } else if (hasZeroCoordinatesAnomaly) {
              session.anomalies.push(
                `Anomalia coordinate con lat: 0 e lon: 0 sopra al 20%`,
              );
            }

            // Return session with either anomalies or null anomalies for good sessions
            return {
              ...session,
              anomalies:
                session.anomalies.length > 0 ? session.anomalies : null,
            };
          }),
        );

        vehicleCheck.sessions = sessionsForVehicle.filter(
          (session) => session !== null,
        );
        return vehicleCheck;
      }),
    );

    // Return vehicles that have any sessions (good or with anomalies)
    return resultsForAllVehicles.filter(
      (item) => Array.isArray(item.sessions) && item.sessions.length > 0,
    );
  }

  /**
   * Ritorna per ogni veicolo se almeno un tag è stato letto in un determinato arco di tempo, senza API
   * @param period_to data di inizio periodo
   * @param period_from data di fine periodo
   * @returns
   */
  private async checkAntenna(dateFrom: Date, dateTo: Date) {
    // controllo data valida
    const validation = validateDateRange(
      dateFrom.toISOString(),
      dateTo.toISOString(),
    );
    if (!validation.isValid) {
      return validation.message;
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const allVehicles = await this.vehicleService.getVehiclesByReader(); //prendi tutti i veicoli che hanno un antenna RFID

    // Get the latest tag read for all vehicles
    const anomaliesForAllVehicles = await Promise.all(
      allVehicles.map(async (vehicle) => {
        const vehicleCheck = {
          plate: vehicle.plate,
          veId: vehicle.veId,
          isCan: vehicle.isCan,
          isRFIDReader: vehicle.isRFIDReader,
          sessions: [],
        };
        const anomaliesForVehicle = await Promise.all(
          daysInRange.slice(0, -1).map(async (day) => {
            const datefrom = day;
            const dateto = new Date(datefrom);
            dateto.setHours(23, 59, 59, 0);
            const lastTag: TagHistoryEntity =
              await this.tagService.getLastTagHistoryByVeIdRanged(
                vehicle.veId,
                datefrom,
                dateto,
              );
            const listSession: SessionEntity[] =
              await this.sessionService.getAllSessionByVeIdRanged(
                vehicle.veId,
                datefrom,
                dateto,
              );
            const filteredSessions: SessionEntity[] = listSession.filter(
              (session) => session.history.length >= 2,
            );
            const sessions = {
              date: day,
              anomalies: [],
            };
            // se nessun tag e sessione trovata stop ricerca
            if (!lastTag && filteredSessions.length === 0) {
              return null;
            }
            // se ci stano sessioni ma no tag, errore
            if (!lastTag && filteredSessions.length > 0) {
              sessions.anomalies.push(`Sessioni trovate ma no tag letti.`);
            }
            // se ci sta un tag ma no sessioni, errore
            if (lastTag && filteredSessions.length === 0) {
              sessions.anomalies.push(`Tag letto ma nessuna sessione trovata.`);
            }
            return sessions;
          }),
        );
        const validSessions = anomaliesForVehicle.filter(
          (session) => session !== null,
        );
        vehicleCheck.sessions = validSessions;
        return vehicleCheck;
      }),
    );
    const allAnomalies = anomaliesForAllVehicles.flat();
    const filteredData = allAnomalies.filter(
      (item) => Array.isArray(item.sessions) && item.sessions.length > 0,
    );

    if (filteredData) {
      return filteredData;
    } else {
      return false;
    }
  }

  /**
   * Ritorna tutti i veicoli dove la data dell'ultima sessione non corrisponde all ultimo evento registrato
   * @returns
   */
  private async checkSession() {
    try {
      const vehicles = await this.vehicleService.getAllVehicles();

      // Recupero le ultime sessioni per tutti i veicoli in parallelo
      const sessions = await Promise.all(
        vehicles.map((vehicle) =>
          this.sessionService.getLastSession(vehicle.veId),
        ),
      );
      // reduce accumulare gli elementi con anomalie
      const brokenVehicles = vehicles.reduce((acc, vehicle, index) => {
        const lastSession = sessions[index]; // Associo la sessione al veicolo corrente
        if (lastSession) {
          const lastVehicleEventTime = new Date(vehicle.lastEvent).getTime();
          const sessionEndTime = new Date(lastSession.period_to).getTime();
          // Calcola la differenza in giorni tra lastVehicleEvent e sessionEnd
          const diffInDays = Math.floor(
            (sessionEndTime - lastVehicleEventTime) / (1000 * 60 * 60 * 24),
          );
          if (diffInDays >= 1) {
            acc.push({
              plate: vehicle.plate,
              veId: vehicle.veId,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.isRFIDReader,
              anomalies: 'Ultima sessione non è stata chiusa correttamente',
            });
          } else if (lastVehicleEventTime > sessionEndTime) {
            acc.push({
              plate: vehicle.plate,
              veId: vehicle.veId,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.isRFIDReader,
              anomalies: 'Presente una sessione nulla',
            });
          }
        }
        return acc;
      }, []);

      if (brokenVehicles.length > 0) {
        return brokenVehicles;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error getting last event: ', error);
      return 'Errore durante la richiesta al db'; // Return error message as string
    }
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
    const mergedData = [];

    // Controlla errore di GPS
    try {
      gpsErrors = await this.checkGPS(dateFrom, dateTo);
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

    // Controlla errore inizio e fine sessione (last event)
    try {
      comparison = await this.checkSession();
      comparison = Array.isArray(comparison) ? comparison : [];
    } catch (error) {
      console.error('Errore nel controllo del last event:', error);
    }

    // Combina i risultati
    try {
      const allPlates = new Set([
        ...gpsErrors.map((item) => item.plate),
        ...fetchedTagComparisons.map((item) => item.plate),
        ...comparison.map((item) => item.plate),
      ]);

      allPlates.forEach((plate) => {
        const gpsEntry = gpsErrors.find((item) => item.plate === plate) || {};
        const tagEntry =
          fetchedTagComparisons.find((item) => item.plate === plate) || {};
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
          veId: gpsEntry.veId || tagEntry.veId || comparisonEntry.veId || null,
          isCan:
            gpsEntry.isCan || tagEntry.isCan || comparisonEntry.isCan || false,
          isRFIDReader:
            gpsEntry.isRFIDReader ||
            tagEntry.isRFIDReader ||
            comparisonEntry.isRFIDReader ||
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

  /**
   * Funzione che formatta in modo corretto il ritorno json
   * @param anomalies lista delle anomalie
   * @returns
   */
  private toDTO(anomalies: AnomalyEntity[]): Array<{
    vehicle: VehicleDTO & { worksite: WorksiteDTO | null };
    anomalies: AnomalyDTO[];
  }> {
    return anomalies
      .reduce(
        (acc, anomaly) => {
          // Trovo il gruppo del veicolo esistente o ne crea uno nuovo
          let vehicleGroup = acc.find(
            (group) => group.vehicle.veId === anomaly.vehicle.veId,
          );

          if (!vehicleGroup) {
            // Crea il DTO del veicolo
            const vehicleDTO = new VehicleDTO();
            vehicleDTO.id = anomaly.vehicle.id;
            vehicleDTO.plate = anomaly.vehicle.plate;
            vehicleDTO.veId = anomaly.vehicle.veId;
            vehicleDTO.isRFIDReader = anomaly.vehicle.isRFIDReader;

            // DTO del worksite se esiste
            let worksiteDTO: WorksiteDTO | null = null;
            if (anomaly.vehicle.worksite) {
              worksiteDTO = new WorksiteDTO();
              worksiteDTO.id = anomaly.vehicle.worksite.id;
              worksiteDTO.name = anomaly.vehicle.worksite.name;
            }

            vehicleGroup = {
              vehicle: { ...vehicleDTO, worksite: worksiteDTO }, // Aggiungo worksite dentro il VehicleDTO
              anomalies: [],
            };
            acc.push(vehicleGroup);
          }

          // Mappa il DTO per l'anomalia
          const anomalyDTO = new AnomalyDTO();
          anomalyDTO.date = anomaly.date;
          anomalyDTO.gps = anomaly.gps;
          anomalyDTO.antenna = anomaly.antenna;
          anomalyDTO.session = anomaly.session;

          // Aggiungi l'anomalia al gruppo del veicolo
          vehicleGroup.anomalies.push(anomalyDTO);

          return acc;
        },
        [] as Array<{
          vehicle: VehicleDTO & { worksite: WorksiteDTO | null };
          anomalies: AnomalyDTO[];
        }>,
      )
      .map((group) => {
        // Ordino le anomalie per data in ordine ascendente per ogni gruppo di veicoli
        group.anomalies.sort((a, b) => a.date.getTime() - b.date.getTime());
        return group;
      })
      .sort((a, b) => a.vehicle.plate.localeCompare(b.vehicle.plate)); // Ordino i veicoli per targa
  }
}
