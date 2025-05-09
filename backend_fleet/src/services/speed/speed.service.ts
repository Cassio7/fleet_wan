import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Redis from 'ioredis';
import { HistoryEntity } from 'src/classes/entities/history.entity';
import { VehicleEntity } from 'src/classes/entities/vehicle.entity';
import { In, Repository } from 'typeorm';

/**
 * Interfaccia per oggetto di ritorno
 */
interface SpeedData {
  plate: string;
  veId: number;
  speed: number;
}

/**
 * Interfaccia per tutte le date utilizzate
 */
interface CalculatedDates {
  todayStr: string;
  yesterdayStr: string;
  daysbefore2Str: string;
  startOfMonthStr: string;
  threeMonthsAgoStr: string;
  startOfYearStr: string;
  alwaysStartStr: string;
}

interface SpeedDataGroups {
  yesterday: SpeedData[];
  thisMonth: SpeedData[];
  last3Months: SpeedData[];
  thisYear: SpeedData[];
  allTime: SpeedData[];
}

@Injectable()
export class SpeedService {
  private readonly logger = new Logger(SpeedService.name);

  constructor(
    @InjectRepository(HistoryEntity, 'readOnlyConnection')
    private readonly historyRepository: Repository<HistoryEntity>,
    @InjectRepository(VehicleEntity, 'readOnlyConnection')
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Recupera dal database le velocità e i veicoli
   * @param start inizio del range
   * @param end fine del range
   * @param key chiave da utilizzare per redis
   * @returns
   */
  async getSpeedRangedDB(
    start: string,
    end: string,
    key: string,
  ): Promise<SpeedData[]> {
    try {
      const queryData = await this.historyRepository
        .createQueryBuilder('history')
        .select('history.vehicleId', 'vehicleId')
        .addSelect('MAX(history.speed)', 'speed')
        .where('history.timestamp >= :start', { start })
        .andWhere('history.timestamp < :end', { end })
        .groupBy('history.vehicleId')
        .orderBy('speed', 'DESC')
        .limit(5)
        .getRawMany();
      const top5: SpeedData[] = [];
      const vehicleIds = queryData.map((item) => item.vehicleId);
      const vehicles = await this.vehicleRepository.find({
        select: {
          id: true,
          veId: true,
          plate: true,
        },
        where: { id: In(vehicleIds) },
      });
      const vehiclesMap: Map<number, VehicleEntity> = new Map();
      vehicles.forEach((vehicle) => {
        vehiclesMap.set(vehicle.id, vehicle);
      });
      for (const item of queryData) {
        const vehicle = vehiclesMap.get(item.vehicleId);
        if (vehicle) {
          top5.push({
            veId: vehicle.veId,
            plate: vehicle.plate,
            speed: item.speed,
          });
        }
      }
      await this.setSpeedsRedis(key, top5);
      return top5;
    } catch (error) {
      this.logger.error(
        'Errore recupero velocità dal db: ',
        error,
        'getSpeedRangedDB',
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante get velocità`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera le top velocità, prima cercando su redis e se non le trova le ricalcolo in fallback
   * @returns
   */
  async getSpeeds(): Promise<SpeedDataGroups> {
    try {
      const {
        todayStr,
        yesterdayStr,
        daysbefore2Str,
        startOfMonthStr,
        threeMonthsAgoStr,
        startOfYearStr,
        alwaysStartStr,
      }: CalculatedDates = this.calculateDates();

      // YESTERDAY
      let yesterday = await this.getSpeedsRedis('yesterday');
      if (!yesterday || yesterday.length === 0) {
        yesterday = await this.getSpeedRangedDB(
          daysbefore2Str,
          yesterdayStr,
          'yesterday',
        );
      }

      // THIS MONTH
      let thisMonth = await this.getSpeedsRedis('thisM');
      if (!thisMonth || thisMonth.length === 0) {
        thisMonth = await this.getSpeedRangedDB(
          startOfMonthStr,
          todayStr,
          'thisM',
        );
      }

      // LAST 6 MONTHS
      let last3Months = await this.getSpeedsRedis('last3M');
      if (!last3Months || last3Months.length === 0) {
        last3Months = await this.getSpeedRangedDB(
          threeMonthsAgoStr,
          todayStr,
          'last3M',
        );
      }

      // THIS YEAR
      let thisYear = await this.getSpeedsRedis('thisY');
      if (!thisYear || thisYear.length === 0) {
        thisYear = await this.getSpeedRangedDB(
          startOfYearStr,
          todayStr,
          'thisY',
        );
      }

      // ALL TIME
      let allTime = await this.getSpeedsRedis('all');
      if (!allTime || allTime.length === 0) {
        allTime = await this.getSpeedRangedDB(alwaysStartStr, todayStr, 'all');
      }
      return {
        yesterday,
        thisMonth,
        last3Months,
        thisYear,
        allTime,
      };
    } catch (error) {
      this.logger.error('Errore get velocità: ', error, 'getSpeeds');
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante get velocità`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Funzione che calcola le velocità e le imposta su Redis per un recupero più veloce
   */
  async setSpeeds(): Promise<SpeedDataGroups> {
    try {
      const {
        todayStr,
        yesterdayStr,
        daysbefore2Str,
        startOfMonthStr,
        threeMonthsAgoStr,
        startOfYearStr,
        alwaysStartStr,
      }: CalculatedDates = this.calculateDates();

      const promises = [
        // Ieri
        this.getSpeedRangedDB(daysbefore2Str, yesterdayStr, 'yesterday'),

        // Questo mese
        this.getSpeedRangedDB(startOfMonthStr, todayStr, 'thisM'),

        // Ultimi 6 mesi
        this.getSpeedRangedDB(threeMonthsAgoStr, todayStr, 'last3M'),

        // Questo anno
        this.getSpeedRangedDB(startOfYearStr, todayStr, 'thisY'),

        // Sempre
        this.getSpeedRangedDB(alwaysStartStr, todayStr, 'all'),
      ];
      await Promise.all(promises);
      return await this.getSpeeds();
    } catch (error) {
      this.logger.error('Errore set velocità: ', error, 'setSpeeds');
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante set velocità`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Imposta su redis le velocità
   * @param rangeKey chiave per impostare
   * @param speeds Oggetto speed
   */
  private async setSpeedsRedis(
    rangeKey: string,
    speeds: SpeedData[],
  ): Promise<void> {
    try {
      const key = 'speeds:' + rangeKey;
      await this.redis.set(key, JSON.stringify(speeds));
    } catch (error) {
      this.logger.error('Errore set Redis: ', error, 'setSpeedsRedis');
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante set velocità`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera da redis le velocità
   * @param rangeKey chiave per redis
   * @returns
   */
  private async getSpeedsRedis(rangeKey: string): Promise<SpeedData[]> {
    try {
      const key = 'speeds:' + rangeKey;
      const data = await this.redis.get(key);
      return JSON.parse(data) as SpeedData[];
    } catch (error) {
      this.logger.error('Errore recupero Redis: ', error, 'getSpeedsRedis');
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero velocità`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Funzione per calcolare i range di ricerca
   * @returns
   */
  private calculateDates(): CalculatedDates {
    const today = new Date();
    const yesterday = new Date(today);
    const daysbefore2 = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    daysbefore2.setDate(today.getDate() - 2);

    const toStr = (date: Date) => date.toISOString().split('T')[0];

    const todayStr = toStr(today);
    const yesterdayStr = toStr(yesterday);
    const daysbefore2Str = toStr(daysbefore2);

    const startOfMonthStr = toStr(
      new Date(today.getFullYear(), today.getMonth(), 1),
    );

    const threeMonthsAgoDate = new Date(today);
    threeMonthsAgoDate.setMonth(today.getMonth() - 3);
    const threeMonthsAgoStr = toStr(threeMonthsAgoDate);

    const startOfYearStr = toStr(new Date(today.getFullYear(), 0, 1));

    const alwaysStartStr = '2000-01-01';

    return {
      todayStr,
      yesterdayStr,
      daysbefore2Str,
      startOfMonthStr,
      threeMonthsAgoStr,
      startOfYearStr,
      alwaysStartStr,
    };
  }
}
