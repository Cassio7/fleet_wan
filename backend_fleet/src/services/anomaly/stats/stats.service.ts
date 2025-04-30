import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnomalyEntity } from 'src/classes/entities/anomaly.entity';
import Redis from 'ioredis';
import { AssociationService } from 'src/services/association/association.service';
import { SessionVehicleService } from 'src/services/session-vehicle/session-vehicle.service';
import { VehicleService } from 'src/services/vehicle/vehicle.service';
import { Repository } from 'typeorm';

interface Stats {
  veId: number;
  max_sessions: number;
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
export class StatsService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly associationService: AssociationService,
    @InjectRepository(AnomalyEntity, 'readOnlyConnection')
    private readonly anomalyRepository: Repository<AnomalyEntity>,
    private readonly vehicleService: VehicleService,
    private readonly sessionVehicleService: SessionVehicleService,
  ) {}

  /**
   * Recupera le informazioni per le statistiche di ogni veicolo
   * @param userId id utente
   * @param veId identificativo veicolo
   * @param skipControl salta il controllo solo server
   * @returns Stats
   */
  async getStatsByVeId(
    userId: number,
    veId: number,
    skipControl: boolean,
  ): Promise<Stats> {
    if (!skipControl) {
      await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    }
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
      if (!anomalies) {
        return null;
      }
      // recupero il numero di sessioni salvate nel db e quelle effettive fatte dal mezzo, tutto nella vista
      const { num_sessions: numSessions, max_sessions: maxSessions } =
        await this.sessionVehicleService.getTotalSessionDetails(veId);

      const keywords = {
        nulla: 'nulla', // anomalia sessione nulla, anche per gps e antenna
        poor: 'poor', // andamento lettura tags
        excellent: 'excellent', // andamento lettura tags
        good: 'good', // andamento lettura tags
        uguali: 'uguali', // anomalia coordinate ugulau gps warn
        tachimetro: 'tachimetro', // anomalia tachimetro gps warn
        superiore: 'superiore', // anomalia distanza km warn
        venti: '20', // anomalia percentuale 20% warn
        totale: 'totale', // anomalia gps error
        letto: 'letto', // tag letto ma no sessione trovata, anomalia antenna error
        letti: 'letti', // sessioni trovate ma no tag letti, anomalia antenna error
        aperta: 'aperta', // sessione aperta, anomalia session error
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
      const warningValue =
        (result?.gps_tachimetro ?? 0) +
        (result?.gps_venti ?? 0) +
        (result?.gps_superiore ?? 0) +
        (result?.gps_uguali ?? 0);
      const stats: Stats = {
        veId: veId,
        max_sessions: maxSessions ?? 0,
        num_sessions: numSessions ?? 0,
        num_anomaly: anomalies[1] ?? 0,
        gps: {
          ok: result.gps_ok ?? 0,
          warning: warningValue ?? 0,
          error: result.gps_totale ?? 0,
          null: result.gps_nulla ?? 0,
        },
        antenna: {
          ok: result.antenna_ok ?? 0,
          nosession: result.antenna_letto ?? 0,
          notag: result.antenna_letti ?? 0,
          null: result.antenna_nulla ?? 0,
        },
        detection_quality: {
          excellent: result.detection_quality_excellent ?? 0,
          good: result.detection_quality_good ?? 0,
          poor: result.detection_quality_poor ?? 0,
        },
        session: {
          ok: result.session_ok ?? 0,
          open: result.session_aperta ?? 0,
          null: result.session_nulla ?? 0,
        },
      };
      return stats;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante calcolo delle statistiche`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calcola tutte le statistiche per tutti i veicoli in parallelo e le salva su redis
   */
  async setAllStatsRedis(): Promise<void> {
    try {
      const allVehicles = await this.vehicleService.getActiveVehicles();
      const stats = await Promise.all(
        allVehicles
          .filter((vehicle) => vehicle.worksite)
          .map(async (vehicle) => {
            const stat = await this.getStatsByVeId(0, vehicle.veId, true);
            return stat;
          }),
      );
      await this.setRedisStats(stats);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante il caricamento delle statistiche su redis`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera tutte le statistiche, da redis, di tutti i veicoli associate all'utente
   * @param userId id utente
   * @returns
   */
  async getAllStatsRedis(userId: number): Promise<Stats[]> {
    const vehiclesId =
      await this.associationService.getVehiclesRedisAllSet(userId);
    const statsArray = await Promise.all(
      vehiclesId.map(async (veId) => {
        const key = `stats:${veId}`;
        try {
          const data = await this.redis.get(key);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          console.log(error);
          return null;
        }
      }),
    );
    const statsTotal = statsArray.filter(
      (stats): stats is Stats => stats !== null,
    );
    return statsTotal;
  }

  /**
   * Salva statistiche su redis
   * @param stats oggetto statistica
   */
  async setRedisStats(stats: Stats[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    for (const stat of stats) {
      const key = `stats:${stat.veId}`;
      pipeline.set(key, JSON.stringify(stat));
    }
    await pipeline.exec();
  }

  /**
   * Recupera da redis le statistiche per un determinato veicolo
   * @param userId id utente
   * @param veId veicolo utente
   * @returns
   */
  async getRedisStats(userId: number, veId: number): Promise<Stats | null> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    const key = `stats:${veId}`;
    try {
      const data = await this.redis.get(key);
      if (!data) {
        return null;
      }
      const dataParse: Stats = JSON.parse(data);
      return dataParse;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle statistiche da redis`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
