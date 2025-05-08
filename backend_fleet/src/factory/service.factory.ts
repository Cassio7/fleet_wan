import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as path from 'path';
import { ServiceEntity } from 'src/classes/entities/service.entity';
import { parseCsvFile } from 'src/utils/utils';
import { DataSource } from 'typeorm';

@Injectable()
export class ServiceFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/SERVIZI.csv');

  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  async createDefaultService(): Promise<ServiceEntity[]> {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const serviceData = await parseCsvFile(this.cvsPath);

      const serviceEntities = serviceData.map((data) =>
        queryRunner.manager.getRepository(ServiceEntity).create({
          name: data.name,
        }),
      );

      const savedServices = await queryRunner.manager
        .getRepository(ServiceEntity)
        .save(serviceEntities);
      await queryRunner.commitTransaction();
      return savedServices;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore durante la creazione dei servizi:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
