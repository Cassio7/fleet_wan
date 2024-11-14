import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyEntity } from 'classes/entities/company.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { parse } from 'csv-parse';
import * as path from 'path';

@Injectable()
export class CompanyFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/SOCIETA.csv');

  constructor(
    @InjectRepository(CompanyEntity, 'mainConnection')
    private companyRepository: Repository<CompanyEntity>,
  ) {}

  // Metodo per parsare il file CSV
  private async parseCsvFile(): Promise<any[]> {
    if (!fs.existsSync(this.cvsPath)) {
      throw new NotFoundException(`File CSV non trovato: ${this.cvsPath}`);
    }
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(this.cvsPath) // Usa il percorso calcolato
        .pipe(parse({ columns: true })) // Usa columns: true per ottenere oggetti chiave-valore
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  async createDefaultCompanies(): Promise<CompanyEntity[]> {
    const companyData = await this.parseCsvFile();

    const companyEntities = companyData.map((data) => {
      const company = new CompanyEntity();
      company.name = data.name;
      company.suId = Number(data.suId);
      return company;
    });

    return this.companyRepository.save(companyEntities);
  }
}
