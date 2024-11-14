import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyEntity } from 'classes/entities/company.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(CompanyEntity, 'mainConnection')
    private readonly companyEntity: Repository<CompanyEntity>,
  ) {}
  /**
   * Ritorna tutte le società salvate
   * @returns oggetto società
   */
  async getAllCompany(): Promise<any> {
    const companies = await this.companyEntity.find();
    return companies;
  }
}
