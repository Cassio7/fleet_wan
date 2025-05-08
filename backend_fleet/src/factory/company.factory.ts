import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as path from 'path';
import { CompanyEntity } from 'src/classes/entities/company.entity';
import { parseCsvFile } from 'src/utils/utils';
import { DataSource } from 'typeorm';

@Injectable()
export class CompanyFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/SOCIETA.csv');

  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  async createDefaultCompanies(): Promise<CompanyEntity[]> {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const companyData = await parseCsvFile(this.cvsPath);
      const companyEntities: CompanyEntity[] = [];
      for (const data of companyData) {
        const company = queryRunner.manager
          .getRepository(CompanyEntity)
          .create({
            name: data.name,
            suId: Number(data.suId),
          });
        companyEntities.push(company);
      }

      const saved = await queryRunner.manager
        .getRepository(CompanyEntity)
        .save(companyEntities);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore durante la creazione delle società:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
