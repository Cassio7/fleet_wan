import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AnomalyEntity } from 'classes/entities/anomaly.entity';
import { SessionEntity } from 'classes/entities/session.entity';
import Redis from 'ioredis';
import { AssociationService } from 'src/services/association/association.service';
import { VehicleService } from 'src/services/vehicle/vehicle.service';
import { Not, Repository } from 'typeorm';

interface Stats {
  veId: number;
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
    @InjectRepository(SessionEntity, 'readOnlyConnection')
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectRedis() private readonly redis: Redis,
    private readonly associationService: AssociationService,
    @InjectRepository(AnomalyEntity, 'readOnlyConnection')
    private readonly anomalyRepository: Repository<AnomalyEntity>,
    private readonly vehicleService: VehicleService,
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
        superiore: 'superiore',
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
      const warningValue =
        (result?.gps_tachimetro ?? 0) +
        (result?.gps_venti ?? 0) +
        (result?.gps_superiore ?? 0);
      const stats: Stats = {
        veId: veId,
        num_sessions: numSessions,
        num_anomaly: anomalies[1],
        gps: {
          ok: result.gps_ok,
          warning: warningValue,
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
   * Calcola tutte le statistiche per tutti i veicoli in parallelo e le salva su redis
   */
  async setAllStatsRedis() {
    try {
      const allVehicles = await this.vehicleService.getAllVehicles();
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
   * Salva statistiche su redis
   * @param stats oggetto statistica
   */
  async setRedisStats(stats: Stats[]) {
    for (const stat of stats) {
      const key = `stats:${stat.veId}`;
      await this.redis.set(key, JSON.stringify(stat));
    }
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
