import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AnomalyDTO } from 'classes/dtos/anomaly.dto';
import { ServiceDTO } from 'classes/dtos/service.dto';
import { VehicleDTO } from 'classes/dtos/vehicle.dto';
import { WorksiteDTO } from 'classes/dtos/worksite.dto';
import { AnomalyEntity } from 'classes/entities/anomaly.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { sortRedisData } from 'src/utils/utils';
import { Between, DataSource, In, Not, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';
import { SessionEntity } from 'classes/entities/session.entity';

interface Stats {
  num_sessions: number;
  num_anomaly: number;
  gps: {
    ok: number;
    warning: number;
    error: number;
    null: number;
  };
  antenna: {
    ok: number;
    nosession: number;
    notag: number;
    null: number;
  };
  detection_quality: {
    excellent: number;
    good: number;
    poor: number;
  };
  session: {
    ok: number;
    open: number;
    null: number;
  };
}

@Injectable()
export class AnomalyService {
  constructor(
    @InjectRepository(AnomalyEntity, 'readOnlyConnection')
    private readonly anomalyRepository: Repository<AnomalyEntity>,
    @InjectRepository(VehicleEntity, 'readOnlyConnection')
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    @InjectRedis() private readonly redis: Redis,
    private readonly associationService: AssociationService,
    @InjectRepository(SessionEntity, 'readOnlyConnection')
    private readonly sessionRepository: Repository<SessionEntity>,
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
    date: Date | null,
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
        session: normalizedSession,
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
      if (!anomaliesQuery) {
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
      if (anomaliesQuery && anomaliesQuery.hash !== hash) {
        // // oggi
        // if (day.getTime() === today.getTime()) {
        //   const anomaly = {
        //     vehicle: vehicle,
        //     date: day,
        //     session: normalizedSession,
        //     gps: normalizedGps,
        //     antenna: normalizedAntenna,
        //     detection_quality: detection_quality,
        //     hash: hash,
        //   };
        //   await queryRunner.manager
        //     .getRepository(AnomalyEntity)
        //     .update({ key: anomaliesQuery.key }, anomaly);
        // } else {
        //   const anomaly = {
        //     vehicle: vehicle,
        //     date: day,
        //     gps: normalizedGps,
        //     antenna: normalizedAntenna,
        //     detection_quality: detection_quality,
        //     hash: hash,
        //   };
        //   await queryRunner.manager
        //     .getRepository(AnomalyEntity)
        //     .update({ key: anomaliesQuery.key }, anomaly);
        // }
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
   * Recupera le informazioni per le statistiche di ogni veicolo
   * @param userId id utente
   * @param veId identificativo veicolo
   * @returns Stats
   */
  async getStatsByVeId(userId: number, veId: number): Promise<Stats> {
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
      const anomalies = await this.anomalyRepository.findAndCount({
        select: {
          id: true,
          gps: true,
          antenna: true,
          detection_quality: true,
          session: true,
        },
        where: {
          vehicle: {
            veId: veId,
          },
        },
      });
      const numSessions = await this.sessionRepository.count({
        select: {
          id: true,
        },
        where: {
          history: {
            vehicle: {
              veId: veId,
            },
          },
          sequence_id: Not(0),
        },
      });
      if (!anomalies) {
        return null;
      }
      const keywords = {
        nulla: 'nulla',
        poor: 'poor',
        excellent: 'excellent',
        good: 'good',
        tachimetro: 'tachimetro',
        venti: '20',
        totale: 'totale',
        letto: 'letto',
        letti: 'letti',
        aperta: 'aperta',
      };
      const result = anomalies[0].reduce(
        (acc, item) => {
          Object.keys(item).forEach((key) => {
            const value = item[key];

            if (value === null) {
              // Se il valore è null, incrementa "_ok"
              acc[`${key}_ok`] = (acc[`${key}_ok`] || 0) + 1;
            } else if (typeof value === 'string') {
              const valueLower = value.toLowerCase();
              Object.keys(keywords).forEach((keyword) => {
                if (valueLower.includes(keyword)) {
                  acc[`${key}_${keywords[keyword]}`] =
                    (acc[`${key}_${keywords[keyword]}`] || 0) + 1;
                }
              });
            }
          });
          return acc;
        },
        {} as Record<string, number>,
      );
      const stats: Stats = {
        num_sessions: numSessions,
        num_anomaly: anomalies[1],
        gps: {
          ok: result.gps_ok,
          warning: result?.gps_tachimetro + result?.gps_venti,
          error: result.gps_totale,
          null: result.gps_nulla,
        },
        antenna: {
          ok: result.antenna_ok,
          nosession: result.antenna_letto,
          notag: result.antenna_letti,
          null: result.antenna_nulla,
        },
        detection_quality: {
          excellent: result.detection_quality_excellent,
          good: result.detection_quality_good,
          poor: result.detection_quality_poor,
        },
        session: {
          ok: result.session_ok,
          open: result.session_aperta,
          null: result.session_nulla,
        },
      };
      return stats;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle anomalie`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
