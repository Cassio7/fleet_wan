import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as path from 'path';
import { EquipmentEntity } from 'src/classes/entities/equipment.entity';
import { parseCsvFile } from 'src/utils/utils';
import { DataSource } from 'typeorm';

@Injectable()
export class EquipmentFacotoryService {
  private readonly cvsPath = path.resolve(
    process.cwd(),
    'files/ATTREZZATURE.csv',
  );

  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  async createDefaultEquipment(): Promise<EquipmentEntity[]> {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const equipmentData = await parseCsvFile(this.cvsPath);

      const equipmentEntities = equipmentData.map((data) =>
        queryRunner.manager.getRepository(EquipmentEntity).create({
          name: data.name,
        }),
      );

      const savedEquipment = await queryRunner.manager
        .getRepository(EquipmentEntity)
        .save(equipmentEntities);
      await queryRunner.commitTransaction();
      return savedEquipment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore durante la creazione delle attrezzature:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
