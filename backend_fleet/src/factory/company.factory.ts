import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyEntity } from 'classes/entities/company.entity';
import { Repository } from 'typeorm';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';

@Injectable()
export class CompanyFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/SOCIETA.csv');

  constructor(
    @InjectRepository(CompanyEntity, 'mainConnection')
    private companyRepository: Repository<CompanyEntity>,
  ) {}

  async createDefaultCompanies(): Promise<CompanyEntity[]> {
    const companyData = await parseCsvFile(this.cvsPath);

    const companyEntities = companyData.map((data) => {
      const company = new CompanyEntity();
      company.name = data.name;
      company.suId = Number(data.suId);
      return company;
    });

    return this.companyRepository.save(companyEntities);
  }
}
