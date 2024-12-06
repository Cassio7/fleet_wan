import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AnomalyEntity } from 'classes/entities/anomaly.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AnomalyService {
  constructor(
    @InjectRepository(AnomalyEntity, 'readOnlyConnection')
    private readonly anomalyRepository: Repository<AnomalyEntity>,
    @InjectRepository(VehicleEntity, 'readOnlyConnection')
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}
  async createAnomaly(
    veId: number,
    day: Date,
    gps: string | null,
    antenna: string | null,
    session: string | null,
  ) {
    const normalizeField = (field: string | null): string | null =>
      field && field.trim() !== '' ? field : null;

    const normalizedGps = normalizeField(gps);
    const normalizedAntenna = normalizeField(antenna);
    const normalizedSession = normalizeField(session);
    const hashAnomaly = (): string => {
      const toHash = {
        veId: veId,
        day: day,
        gps: normalizedGps,
        antenna: normalizedAntenna,
        session: normalizedSession,
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
      // Crea l'entità Anomaly
    } catch (error) {
      console.error('Errore nel inserimento nuova anomalia: ' + error);
    } finally {
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }

    const anomaly = await this.anomalyRepository;
  }
}
