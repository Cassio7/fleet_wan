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
  async getAllAnomaly(veId: number[]): Promise<any> {
    const anomalies = this.anomalyRepository.find({
      where: {
        vehicle: {
          veId: In(veId),
        },
      },
      relations: {
        vehicle: true,
      },
      order: {
        vehicle: {
          plate: 'ASC',
        },
      },
    });
    return anomalies;
  }

  /**
   * Recupera le anomalie di tutti i veicoli passati, soltanto quello con data piu recente
   * @param veId id dei veicoli
   * @returns
   */
  async getLastAnomaly(veId: number[]): Promise<any> {
    const anomalies = await this.anomalyRepository
      .createQueryBuilder('anomaly')
      .innerJoinAndSelect('anomaly.vehicle', 'vehicle')
      .where((qb) => {
        const subQuery = qb
          .subQuery()
          .select('MAX(a2.date)')
          .from('anomaly', 'a2')
          .where('a2.vehicle_id = anomaly.vehicle_id')
          .getQuery();
        return 'anomaly.date = ' + subQuery;
      })
      .andWhere('vehicle.veId IN (:...veId)', { veId })
      .orderBy('vehicle.plate', 'ASC')
      .getMany();

    return anomalies;
  }

  /**
   * Restituisce le anomalie in base ai veid inseriti e in base al giorno
   * @param veId Id dei veicoli
   * @param date data da controllare
   * @returns
   */
  async getAnomalyByDate(veId: number[], date: Date): Promise<any> {
    date.setHours(0, 0, 0, 0);
    const anomalies = await this.anomalyRepository.find({
      where: {
        vehicle: {
          veId: In(veId),
        },
        date: date,
      },
      relations: {
        vehicle: true,
      },
      order: {
        vehicle: {
          plate: 'ASC',
        },
      },
    });

    return anomalies.reduce(
      (acc, anomaly) => {
        // Trova il gruppo del veicolo esistente o ne crea uno nuovo
        let vehicleGroup = acc.find(
          (group) => group.vehicle.veId === anomaly.vehicle.veId,
        );

        if (!vehicleGroup) {
          const vehicleDTO = new VehicleDTO();
          vehicleDTO.plate = anomaly.vehicle.plate;
          vehicleDTO.veId = anomaly.vehicle.veId;
          vehicleDTO.isRFIDReader = anomaly.vehicle.isRFIDReader;

          vehicleGroup = {
            vehicle: vehicleDTO,
            anomalies: [],
          };
          acc.push(vehicleGroup);
        }

        const anomalyDTO = new AnomalyDTO();
        // Assumo che questi siano i campi dell'AnomalyDTO, adattali secondo la tua implementazione
        anomalyDTO.date = anomaly.date;
        anomalyDTO.gps = anomaly.gps;
        anomalyDTO.antenna = anomaly.antenna;
        anomalyDTO.session = anomaly.session;
        // ... altri campi dell'anomalia ...

        vehicleGroup.anomalies.push(anomalyDTO);

        return acc;
      },
      [] as Array<{ vehicle: VehicleDTO; anomalies: AnomalyDTO[] }>,
    );
  }

  /**
   * Restituisce le anomalie in base al range temporale di inserimento
   * @param veId id dei veicoli da recuperare
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns
   */
  async getAnomalyByDateRange(
    veId: number[],
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any> {
    dateFrom.setHours(0, 0, 0, 0);
    dateTo.setHours(0, 0, 0, 0);
    const anomalies = await this.anomalyRepository.find({
      where: {
        vehicle: {
          veId: In(veId),
        },
        date: Between(dateFrom, dateTo),
      },
      relations: {
        vehicle: true,
      },
      order: {
        vehicle: {
          plate: 'ASC',
        },
      },
    });
    return anomalies.reduce(
      (acc, anomaly) => {
        // Trova il gruppo del veicolo esistente o ne crea uno nuovo
        let vehicleGroup = acc.find(
          (group) => group.vehicle.veId === anomaly.vehicle.veId,
        );

        if (!vehicleGroup) {
          const vehicleDTO = new VehicleDTO();
          vehicleDTO.plate = anomaly.vehicle.plate;
          vehicleDTO.veId = anomaly.vehicle.veId;
          vehicleDTO.isRFIDReader = anomaly.vehicle.isRFIDReader;

          vehicleGroup = {
            vehicle: vehicleDTO,
            anomalies: [],
          };
          acc.push(vehicleGroup);
        }

        const anomalyDTO = new AnomalyDTO();
        // Assumo che questi siano i campi dell'AnomalyDTO, adattali secondo la tua implementazione
        anomalyDTO.date = anomaly.date;
        anomalyDTO.gps = anomaly.gps;
        anomalyDTO.antenna = anomaly.antenna;
        anomalyDTO.session = anomaly.session;
        // ... altri campi dell'anomalia ...

        vehicleGroup.anomalies.push(anomalyDTO);

        return acc;
      },
      [] as Array<{ vehicle: VehicleDTO; anomalies: AnomalyDTO[] }>,
    );
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
  }

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
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const hash = hashAnomaly();
      const anomaliesQuery = await this.anomalyRepository.findOne({
        where: {
          date: day,
          vehicle: {
            veId: veId,
          },
        },
      });
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
    } catch (error) {
      console.error('Errore nel inserimento nuova anomalia: ' + error);
    } finally {
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }
  }

  private async checkSessionGPSAllNoApi(dateFrom: Date, dateTo: Date) {
    const validation = validateDateRange(
      dateFrom.toISOString(),
      dateTo.toISOString(),
    );
    if (!validation.isValid) {
      return validation.message;
    }

    const daysInRange = getDaysInRange(new Date(dateFrom), new Date(dateTo));
    const vehicles = await this.vehicleService.getAllVehicles();

    const anomaliesForAllVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        const vehicleCheck = {
          plate: vehicle.plate,
          veId: vehicle.veId,
          isCan: vehicle.isCan,
          isRFIDReader: vehicle.isRFIDReader,
          sessions: [],
        };

        const anomaliesForVehicle = await Promise.all(
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

            const sessions = {
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
                  sessions.anomalies.push(
                    `Anomalia tachimetro, distanza sempre uguale a ${distanceMap[0]}`,
                  );
                }
              } else {
                const hasDistanceAnomaly =
                  distanceMap.every(
                    (distance) => distance === distanceMap[0],
                  ) || distanceMap.every((distance) => distance === 0);

                if (hasDistanceAnomaly && isCoordinatesFixed) {
                  sessions.anomalies.push(
                    `Anomalia totale, distanza: ${distanceMap[0]} e lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
                  );
                  // Return early to avoid duplicate coordinate anomaly message
                  return sessions;
                }
              }
            }

            // Add coordinate-related anomalies
            if (isCoordinatesFixed) {
              sessions.anomalies.push(
                `Anomalia coordinate, sempre uguali a lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
              );
            } else if (hasZeroCoordinatesAnomaly) {
              sessions.anomalies.push(
                `Anomalia coordinate con lat: 0 e lon: 0 sopra al 20%`,
              );
            }

            return sessions.anomalies.length > 0 ? sessions : null;
          }),
        );

        vehicleCheck.sessions = anomaliesForVehicle.filter(
          (session) => session !== null,
        );
        return vehicleCheck;
      }),
    );

    return anomaliesForAllVehicles.filter(
      (item) => Array.isArray(item.sessions) && item.sessions.length > 0,
    );
  }

  /**
   * Ritorna per ogni veicolo se almeno un tag è stato letto in un determinato arco di tempo, senza API
   * @param period_to data di inizio periodo
   * @param period_from data di fine periodo
   * @returns
   */
  private async tagComparisonAllWithTimeRangeNoApi(
    dateFrom: Date,
    dateTo: Date,
  ) {
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

  private async lastEventComparisonAllNoApi() {
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
      gpsErrors = await this.checkSessionGPSAllNoApi(dateFrom, dateTo);
      gpsErrors = Array.isArray(gpsErrors) ? gpsErrors : [];
    } catch (error) {
      console.error('Errore nel controllo errori del GPS:', error);
    }

    // Controlla errore Antenna
    try {
      fetchedTagComparisons = await this.tagComparisonAllWithTimeRangeNoApi(
        dateFrom,
        dateTo,
      );
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
      comparison = await this.lastEventComparisonAllNoApi();
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
}
