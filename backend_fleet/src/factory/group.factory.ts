import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as path from 'path';
import { CompanyEntity } from 'src/classes/entities/company.entity';
import { GroupEntity } from 'src/classes/entities/group.entity';
import { parseCsvFile } from 'src/utils/utils';
import { DataSource } from 'typeorm';

@Injectable()
export class GroupFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/COMUNI.csv');

  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  async createDefaultGroup(): Promise<GroupEntity[]> {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const groupData = await parseCsvFile(this.cvsPath);

      const groupEntities: GroupEntity[] = [];

      for (const data of groupData) {
        const company = await queryRunner.manager
          .getRepository(CompanyEntity)
          .findOne({
            where: { id: data.companyId },
          });

        if (!company) {
          throw new Error(`Società non trovata: ${data.companyId}`);
        }

        const group = queryRunner.manager.getRepository(GroupEntity).create({
          vgId: data.vgId,
          name: data.name,
          company,
        });

        groupEntities.push(group);
      }

      const saved = await queryRunner.manager
        .getRepository(GroupEntity)
        .save(groupEntities);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore durante la creazione dei gruppi:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
