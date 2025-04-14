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
import { Between, DataSource, In, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';

interface RankedAnomalies {
  veId: number;
  consecutive: {
    gps: number;
    antenna: number;
    session: number;
  };
}

interface VehicleWithAnomaly {
  vehicle: VehicleDTO & {
    worksite: WorksiteDTO | null;
    service: ServiceDTO | null;
  };
  anomalies: AnomalyDTO[];
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
  ) {}

  /**
   * NOTA: al momento allestimento viene inserito dentro isRFIDReader ma nel futuro deve essere cambiato
   */

  /**
   * Recupera tutte le anomalie salvate
   * @param userId user id
   * @returns
   */
  async getAllAnomalyByUserId(userId: number): Promise<VehicleWithAnomaly[]> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
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
  ): Promise<VehicleWithAnomaly[]> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
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
  async getLastAnomaly(userId: number): Promise<
    Array<{
      vehicle: VehicleDTO & {
        worksite: WorksiteDTO | null;
        service: ServiceDTO | null;
      };
      anomalies: AnomalyDTO[];
    }>
  > {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
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
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const countSessionErrors = await this.countSessionErrors(
        userId,
        yesterday,
      );
      // creo una mappa con il ritorno
      const countMap: Map<
        number,
        { gps: number; antenna: number; session: number }
      > = new Map();
      countSessionErrors.forEach((item) => {
        countMap.set(item.veId, {
          gps: item.consecutive.gps,
          antenna: item.consecutive.antenna,
          session: item.consecutive.session,
        });
      });
      return this.toDTO(filteredAnomalies, countMap);
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
  async getAnomalyByDate(
    userId: number,
    date: Date,
  ): Promise<VehicleWithAnomaly[]> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
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
  ): Promise<VehicleWithAnomaly[]> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
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
  ): Promise<VehicleWithAnomaly[]> {
    await this.associationService.hasVehiclesAssociateUserRedisSet(
      userId,
      veId,
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
   * Recupera le anomalie odierne da redis, se non sono presenti le prende dal database (fallback)
   * @param userId id utente
   * @param dateFrom data di quando recuperare
   * @returns
   */
  async getTodayAnomalyRedis(userId: number, dateFrom: Date): Promise<any> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
      const lastUpdate = await this.redis.get('todayAnomaly:lastUpdate');
      const redisPromises = veIdArray.map(async (id) => {
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
  async setTodayAnomalyRedis(anomalies: any): Promise<boolean> {
    const pipeline = this.redis.pipeline();
    for (const anomaly of anomalies) {
      const key = `todayAnomaly:${anomaly.vehicle.veId}`;
      pipeline.set(key, JSON.stringify(anomaly));
    }
    const lastUpdateKey = `todayAnomaly:lastUpdate`;
    pipeline.set(lastUpdateKey, new Date().toISOString());
    await pipeline.exec();
    return true;
  }

  /**
   * Recupera le ultime anomalie da redis, se non trova va in fallback sul database
   * @param userId user id
   * @returns
   */
  async getLastAnomalyRedis(userId: number): Promise<any> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
      const redisPromises = veIdArray.map(async (id) => {
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
  async setLastAnomalyRedis(anomalies: any): Promise<boolean> {
    const pipeline = this.redis.pipeline();
    for (const anomaly of anomalies) {
      const key = `lastAnomaly:${anomaly.vehicle.veId}`;
      pipeline.set(key, JSON.stringify(anomaly));
    }
    await pipeline.exec();
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
   * Conta gli errori consecutivi per il gps, antenna e sessione
   * @param userId user data
   * @param date data da dove far partire il controllo a ritroso
   * @returns
   */
  async countSessionErrors(
    userId: number,
    date: Date,
  ): Promise<RankedAnomalies[]> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
      const formattedDate = date.toISOString().split('T')[0];

      const query = `
    WITH 
      RANKED_ANOMALIES AS (
        SELECT
          a.session,
          a.antenna,
          a.gps,
          v."veId",
          ROW_NUMBER() OVER (
            PARTITION BY v."veId" 
            ORDER BY a.date DESC
          ) AS rn
        FROM
          public.anomalies AS a
          JOIN public.vehicles AS v ON v.id = a."vehicleId"
        WHERE
          v."veId" IN (${veIdArray.join(', ')})
          AND a.date <= '${formattedDate}'
      ),
      FIRST_NULL_SESSION AS (
        SELECT
          "veId",
          MIN(rn) AS first_null_position
        FROM
          RANKED_ANOMALIES
        WHERE
          session IS NULL
        GROUP BY
          "veId"
      ),
      FIRST_NULL_ANTENNA AS (
        SELECT
          "veId",
          MIN(rn) AS first_null_position
        FROM
          RANKED_ANOMALIES
        WHERE
          antenna IS NULL
        GROUP BY
          "veId"
      ),
      FIRST_NULL_GPS AS (
        SELECT
          "veId",
          MIN(rn) AS first_null_position
        FROM
          RANKED_ANOMALIES
        WHERE
          gps IS NULL
        GROUP BY
          "veId"
      )
    SELECT
      r."veId" as "veId",
      COUNT(CASE WHEN (f_session.first_null_position IS NULL OR r.rn < f_session.first_null_position) AND r.session IS NOT NULL THEN 1 END) AS consecutive_session,
      COUNT(CASE WHEN (f_antenna.first_null_position IS NULL OR r.rn < f_antenna.first_null_position) AND r.antenna IS NOT NULL THEN 1 END) AS consecutive_antenna,
      COUNT(CASE WHEN (f_gps.first_null_position IS NULL OR r.rn < f_gps.first_null_position) AND r.gps IS NOT NULL THEN 1 END) AS consecutive_gps
    FROM
      RANKED_ANOMALIES r
      LEFT JOIN FIRST_NULL_SESSION f_session ON r."veId" = f_session."veId"
      LEFT JOIN FIRST_NULL_ANTENNA f_antenna ON r."veId" = f_antenna."veId"
      LEFT JOIN FIRST_NULL_GPS f_gps ON r."veId" = f_gps."veId"
    GROUP BY
      r."veId";
  `;

      const datas = await this.anomalyRepository.query(query);
      const ranked: RankedAnomalies[] = datas.map((item) => ({
        veId: item.veId,
        consecutive: {
          gps: Number(item.consecutive_gps),
          antenna: Number(item.consecutive_antenna),
          session: Number(item.consecutive_session),
        },
      }));

      return ranked;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante il calcolo del conteggio degli errori ripetuti`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Funzione che formatta in modo corretto il ritorno json
   * @param anomalies lista delle anomalie
   * @param countMap mappa della conta degli errori, soltanto per il last
   * @returns
   */
  private toDTO(
    anomalies: AnomalyEntity[],
    countMap?: Map<
      number,
      {
        gps: number;
        antenna: number;
        session: number;
      }
    >,
  ): VehicleWithAnomaly[] {
    return anomalies
      .reduce((acc, anomaly) => {
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
            worksiteDTO.id = anomaly.vehicle.worksite?.id;
            worksiteDTO.name = anomaly.vehicle.worksite?.name;
          }
          // DTO del service se esiste
          let serviceDTO: ServiceDTO | null = null;
          if (anomaly.vehicle.worksite) {
            serviceDTO = new ServiceDTO();
            serviceDTO.id = anomaly.vehicle.service?.id;
            serviceDTO.name = anomaly.vehicle.service?.name;
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
        anomalyDTO.gps_count =
          countMap?.get(anomaly.vehicle?.veId)?.gps ?? null;
        anomalyDTO.antenna = anomaly.antenna;
        anomalyDTO.antenna_count =
          countMap?.get(anomaly.vehicle?.veId)?.antenna ?? null;
        anomalyDTO.detection_quality = anomaly.detection_quality;
        anomalyDTO.session = anomaly.session;
        anomalyDTO.session_count =
          countMap?.get(anomaly.vehicle?.veId)?.session ?? null;

        // Aggiungi l'anomalia al gruppo del veicolo
        vehicleGroup.anomalies.push(anomalyDTO);

        return acc;
      }, [] as VehicleWithAnomaly[])
      .map((group) => {
        // Ordino le anomalie per data in ordine ascendente per ogni gruppo di veicoli
        group.anomalies.sort((a, b) => a.date.getTime() - b.date.getTime());
        return group;
      })
      .sort((a, b) => a.vehicle.plate.localeCompare(b.vehicle.plate)); // Ordino i veicoli per targa
  }
}
