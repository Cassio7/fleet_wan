import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { WorkzoneEntity } from 'src/classes/entities/workzone.entity';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';
import { DataSource } from 'typeorm';

@Injectable()
export class WorkzoneFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/ZONA.csv');

  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  async createDefaultWorkzone(): Promise<WorkzoneEntity[]> {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const workzoneData = await parseCsvFile(this.cvsPath);

      const workzoneEntities = workzoneData.map((data) =>
        queryRunner.manager.getRepository(WorkzoneEntity).create({
          name: data.name,
        }),
      );

      const savedWorkzones = await queryRunner.manager
        .getRepository(WorkzoneEntity)
        .save(workzoneEntities);
      await queryRunner.commitTransaction();
      return savedWorkzones;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore durante la creazione delle zone di lavoro:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
