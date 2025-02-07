import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AnomalyDTO } from 'classes/dtos/anomaly.dto';
import { VehicleDTO } from 'classes/dtos/vehicle.dto';
import { WorksiteDTO } from 'classes/dtos/worksite.dto';
import { AnomalyEntity } from 'classes/entities/anomaly.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import {
  getDaysInRange,
  sortRedisData,
  validateDateRange,
} from 'src/utils/utils';
import { Between, DataSource, In, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';
import { SessionService } from '../session/session.service';
import { TagService } from '../tag/tag.service';
import { VehicleService } from '../vehicle/vehicle.service';
import { ServiceDTO } from 'classes/dtos/service.dto';

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
    private readonly associationService: AssociationService,
  ) {}

  /**
   * NOTA: al momento allestimento viene inserito dentro isRFIDReader ma nel futuro deve essere cambiato
   */

  /**
   * Recupera tutte le anomalie salvate
   * @param userId user id
   * @returns
   */
  async getAllAnomalyByUserId(userId: number): Promise<any> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    try {
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const veIdArray = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];
      const anomalies = await this.anomalyRepository.find({
        where: {
          vehicle: {
            veId: In(veIdArray),
          },
        },
        relations: {
          vehicle: {
            worksite: true,
            service: true,
          },
        },
        order: {
          vehicle: {
            plate: 'ASC',
          },
        },
      });
      return this.toDTO(anomalies);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle anomalie`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera tutte le anomalie dato un mezzo inserito, controllando che utente abbia l'accesso
   * @param userId user id
   * @param veId veid del veicolo
   * @returns
   */
  async getAllAnomalyByVeId(
    userId: number,
    veId: number,
    count: number,
  ): Promise<any> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    if (!vehicles.find((v) => v.veId === veId))
      throw new HttpException(
        'Non hai il permesso per visualizzare le anomalie di questo veicolo',
        HttpStatus.FORBIDDEN,
      );
    try {
      if (count === 0) {
        const anomalies = await this.anomalyRepository.find({
          where: {
            vehicle: {
              veId: veId,
            },
          },
          relations: {
            vehicle: {
              worksite: true,
              service: true,
            },
          },
          order: {
            date: 'DESC',
          },
        });
        return this.toDTO(anomalies);
      } else {
        const anomalies = await this.anomalyRepository.find({
          where: {
            vehicle: {
              veId: veId,
            },
          },
          relations: {
            vehicle: {
              worksite: true,
              service: true,
            },
          },
          order: {
            date: 'DESC',
          },
          take: count,
          skip: 0,
        });
        return this.toDTO(anomalies);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle anomalie`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Recupera le anomalia piu recente per ogni veicolo passato come parametro, escludendo
   * la data odierna
   * @param userId user id
   * @returns
   */
  async getLastAnomaly(userId: number): Promise<any> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
    const veIdArray = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    try {
      // Recupero le ultime 2 anomalie per ogni veicolo
      const anomalies = await this.anomalyRepository
        .createQueryBuilder('anomalies')
        .innerJoinAndSelect('anomalies.vehicle', 'vehicle')
        .leftJoinAndSelect('vehicle.worksite', 'worksite')
        .leftJoinAndSelect('vehicle.service', 'service')
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
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle anomalie`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Restituisce le anomalie in base ai veid inseriti e in base al giorno
   * @param userId user id
   * @param date data da controllare
   * @returns
   */
  async getAnomalyByDate(userId: number, date: Date): Promise<any> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    try {
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const veIdArray = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];
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
            service: true,
          },
        },
        order: {
          vehicle: {
            plate: 'ASC',
          },
        },
      });

      return this.toDTO(anomalies);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle anomalie`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Restituisce le anomalie in base al range temporale di inserimento
   * @param userId user id
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns
   */
  async getAnomalyByDateRange(
    userId: number,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    try {
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const veIdArray = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];
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
            service: true,
          },
        },
        order: {
          vehicle: {
            plate: 'ASC',
          },
        },
      });
      return this.toDTO(anomalies);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle anomalie`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ricerca anomalie in base al veid e range temporale
   * @param userId user id per check autorizzazione
   * @param veId veId del veicolo
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns
   */
  async getAnomalyVeIdByDateRange(
    userId: number,
    veId: number,
    dateFrom: Date,
    dateTo: Date,
  ) {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    if (!vehicles.find((v) => v.veId === veId))
      throw new HttpException(
        'Non hai il permesso per visualizzare le anomalie di questo veicolo',
        HttpStatus.FORBIDDEN,
      );
    dateFrom.setHours(0, 0, 0, 0);
    dateTo.setHours(0, 0, 0, 0);
    try {
      // se le date sono uguali ricerca soltanto per giorno
      if (dateFrom.getTime() === dateTo.getTime()) {
        const anomalies = await this.anomalyRepository.find({
          where: {
            vehicle: {
              veId: veId,
            },
            date: dateFrom,
          },
          relations: {
            vehicle: {
              worksite: true,
              service: true,
            },
          },
          order: {
            vehicle: {
              plate: 'ASC',
            },
          },
        });
        return this.toDTO(anomalies);
      } else {
        // ricerca between
        const anomalies = await this.anomalyRepository.find({
          where: {
            vehicle: {
              veId: veId,
            },
            date: Between(dateFrom, dateTo),
          },
          relations: {
            vehicle: {
              worksite: true,
              service: true,
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
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle anomalie`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Imposta le anomalie di ieri su Redis per recupero veloce
   * @param anomalies
   */
  // async setDayBeforeAnomalyRedis(anomalies: any) {
  //   for (const anomaly of anomalies) {
  //     const key = `dayBeforeAnomaly:${anomaly.vehicle.veId}`;
  //     await this.redis.set(key, JSON.stringify(anomaly));
  //   }
  //   return true;
  // }

  /**
   * Recupera le anomalie odierne da redis, se non sono presenti le prende dal database (fallback)
   * @param userId id utente
   * @param dateFrom data di quando recuperare
   * @returns
   */
  async getTodayAnomalyRedis(userId: number, dateFrom: Date): Promise<any> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
    try {
      const lastUpdate = await this.redis.get('todayAnomaly:lastUpdate');
      const redisPromises = vehicleIds.map(async (id) => {
        const key = `todayAnomaly:${id}`;
        try {
          const data = await this.redis.get(key);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          if (error instanceof HttpException) throw error;
          throw new HttpException(
            `Errore durante recupero delle anomalie da redis`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      });
      let anomalies = (await Promise.all(redisPromises)).filter(Boolean);
      anomalies = sortRedisData(anomalies);
      if (!anomalies || anomalies.length === 0) {
        anomalies = await this.getAnomalyByDate(userId, dateFrom);
      }
      return { lastUpdate, anomalies };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle anomalie`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
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
    const key = `todayAnomaly:lastUpdate`;
    await this.redis.set(key, new Date().toISOString());
    return true;
  }

  /**
   * Recupera le ultime anomalie da redis, se non trova va in fallback sul database
   * @param userId user id
   * @returns
   */
  async getLastAnomalyRedis(userId: number): Promise<any> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
    try {
      const redisPromises = vehicleIds.map(async (id) => {
        const key = `lastAnomaly:${id}`;
        try {
          const data = await this.redis.get(key);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          if (error instanceof HttpException) throw error;
          throw new HttpException(
            `Errore durante recupero delle anomalie da redis`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      });
      let anomalies = (await Promise.all(redisPromises)).filter(Boolean);
      anomalies = sortRedisData(anomalies);
      if (!anomalies || anomalies.length === 0) {
        anomalies = await this.getLastAnomaly(userId);
      }
      return anomalies;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle anomalie`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    detection_quality: string | null,
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
        detection_quality: detection_quality,
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
        // oggi
        if (day.getTime() === today.getTime()) {
          const anomaly = {
            vehicle: vehicle,
            date: day,
            session: normalizedSession,
            gps: normalizedGps,
            antenna: normalizedAntenna,
            detection_quality: detection_quality,
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
            detection_quality: detection_quality,
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
            detection_quality: detection_quality,
            hash: hash,
          });
        await queryRunner.manager.getRepository(AnomalyEntity).save(anomaly);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Errore durante la creazione della anomalia',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Controllo tutte le sessioni di tutti i veicoli, per marcare quelle con dei malfunzionamenti al GPS
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
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

    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const allVehicles = await this.vehicleService.getAllVehicles();

    const anomaliesForDays = await Promise.all(
      daysInRange.slice(0, -1).map(async (day) => {
        const startOfDay = new Date(day);
        const endOfDay = new Date(day);
        endOfDay.setHours(23, 59, 59, 0);

        const vehicleIds = allVehicles.map((v) => v.veId);

        // Recupera tutte le sessioni in un'unica chiamata per il giorno corrente
        const sessionMap =
          await this.sessionService.getAllSessionsByVeIdsAndRange(
            vehicleIds,
            startOfDay,
            endOfDay,
          );
        return allVehicles.map((vehicle) => {
          const sessionsDay = sessionMap.get(vehicle.veId) || [];
          if (sessionsDay.length === 0) {
            return null;
          }

          const coordinates = sessionsDay.map((data) => ({
            latitude: data.latitude,
            longitude: data.longitude,
          }));

          if (coordinates.length <= 4) {
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
            zeroCoordinatesCount > coordinates.length * 0.2;

          const groupedBySequence = sessionsDay.reduce((acc, item) => {
            acc[item.sequence_id] = acc[item.sequence_id] || [];
            acc[item.sequence_id].push(item);
            return acc;
          }, {});

          const skipDistanceCheck =
            Object.keys(groupedBySequence).length === 1 &&
            groupedBySequence[0]?.length > 0;

          if (!skipDistanceCheck) {
            const distanceMap = sessionsDay.map((data) => data.distance);

            if (vehicle.isCan) {
              const hasDistanceAnomaly = distanceMap.every(
                (distance) => distance === 0,
              );
              if (hasDistanceAnomaly) {
                anomalies.push(
                  `Anomalia tachimetro, distanza sempre uguale a ${distanceMap[0]}`,
                );
              }
            } else {
              const hasDistanceAnomaly =
                distanceMap.every((distance) => distance === distanceMap[0]) ||
                distanceMap.every((distance) => distance === 0);

              if (hasDistanceAnomaly && isCoordinatesFixed) {
                anomalies.push(
                  `Anomalia totale, distanza: ${distanceMap[0]} e lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
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

          const groupedBySequence = sessionsDay.reduce((acc, item) => {
            acc[item.sequence_id] = acc[item.sequence_id] || [];
            acc[item.sequence_id].push(item);
            return acc;
          }, {});

          const filteredSessions = Object.values(groupedBySequence).filter(
            (group: any) => group.length >= 2,
          );

          // se nessun tag e sessione trovata stop ricerca
          if (!lastTag && filteredSessions.length === 0) {
            return null;
          }
          const anomalies = [];
          if (!lastTag && filteredSessions.length > 0) {
            anomalies.push('Sessioni trovate ma no tag letti.');
          }
          if (lastTag && filteredSessions.length === 0) {
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
   * Ritorna tutti i veicoli dove la data dell'ultima sessione non corrisponde all ultimo evento registrato
   * @returns
   */
  private async checkSession() {
    try {
      const vehicles = await this.vehicleService.getAllVehicles();
      const vehicleIds = vehicles.map((v) => v.veId);

      // Recupero le ultime sessioni per tutti i veicoli in parallelo
      let sessionsMap =
        await this.sessionService.getLastSessionRedis(vehicleIds);
      if (!sessionsMap)
        sessionsMap =
          await this.sessionService.getLastSessionByVeIds(vehicleIds);
      const brokenVehicles = vehicles.reduce((acc, vehicle) => {
        const lastSession = sessionsMap.get(vehicle.veId) || null;
        if (lastSession) {
          const lastVehicleEventTime = new Date(vehicle.lastEvent).getTime();
          const sessionEndTime = new Date(lastSession.period_to).getTime();

          // Calcola la differenza in giorni
          const diffInDays = Math.floor(
            (sessionEndTime - lastVehicleEventTime) / (1000 * 60 * 60 * 24),
          );

          if (diffInDays >= 1) {
            acc.push({
              plate: vehicle.plate,
              veId: vehicle.veId,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.allestimento,
              anomalies: 'Ultima sessione non è stata chiusa correttamente',
            });
          } else if (lastVehicleEventTime > sessionEndTime) {
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

  private async checkQuality(dateFrom: Date, dateTo: Date) {
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
    let quality: any = []; // Controllo errori detection_quality
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
        ...quality.map((item) => item.plate),
        ...comparison.map((item) => item.plate),
      ]);

      allPlates.forEach((plate) => {
        const gpsEntry = gpsErrors.find((item) => item.plate === plate) || {};
        const tagEntry =
          fetchedTagComparisons.find((item) => item.plate === plate) || {};
        const qualityEntry = quality.find((item) => item.plate === plate) || {};
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
            null,
          isCan:
            gpsEntry.isCan ||
            tagEntry.isCan ||
            comparisonEntry.isCan ||
            qualityEntry.isCan ||
            false,
          isRFIDReader:
            gpsEntry.isRFIDReader ||
            tagEntry.isRFIDReader ||
            comparisonEntry.isRFIDReader ||
            qualityEntry.isRFIDReader ||
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
    vehicle: VehicleDTO & {
      worksite: WorksiteDTO | null;
      service: ServiceDTO | null;
    };
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
            // per comodità è stato tenuto il nome isRFIDReader per recupero frontend
            vehicleDTO.isRFIDReader = anomaly.vehicle.allestimento;

            // DTO del worksite se esiste
            let worksiteDTO: WorksiteDTO | null = null;
            if (anomaly.vehicle.worksite) {
              worksiteDTO = new WorksiteDTO();
              worksiteDTO.id = anomaly.vehicle.worksite.id;
              worksiteDTO.name = anomaly.vehicle.worksite.name;
            }
            // DTO del service se esiste
            let serviceDTO: ServiceDTO | null = null;
            if (anomaly.vehicle.worksite) {
              serviceDTO = new ServiceDTO();
              serviceDTO.id = anomaly.vehicle.service.id;
              serviceDTO.name = anomaly.vehicle.service.name;
            }

            vehicleGroup = {
              vehicle: {
                ...vehicleDTO,
                worksite: worksiteDTO,
                service: serviceDTO,
              }, // Aggiungo worksite dentro il VehicleDTO
              anomalies: [],
            };
            acc.push(vehicleGroup);
          }

          // Mappa il DTO per l'anomalia
          const anomalyDTO = new AnomalyDTO();
          anomalyDTO.date = anomaly.date;
          anomalyDTO.gps = anomaly.gps;
          anomalyDTO.antenna = anomaly.antenna;
          anomalyDTO.detection_quality = anomaly.detection_quality;
          anomalyDTO.session = anomaly.session;

          // Aggiungi l'anomalia al gruppo del veicolo
          vehicleGroup.anomalies.push(anomalyDTO);

          return acc;
        },
        [] as Array<{
          vehicle: VehicleDTO & {
            worksite: WorksiteDTO | null;
            service: ServiceDTO | null;
          };
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
