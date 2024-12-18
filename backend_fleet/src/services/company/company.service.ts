import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyEntity } from 'classes/entities/company.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(CompanyEntity, 'readOnlyConnection')
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

  /**
   * Ritorna l'oggetto società 
   * @param veId Ricerca in base all veId del veicolo
   * @returns 
   */
  async getCompanyByVeId(veId): Promise<any> {
    const company = await this.companyEntity.findOne({
      where: {
        group: {
          worksite_group: {
            worksite: {
              vehicle: {
                veId: veId,
              },
            },
          },
        },
      },
    });
    return company
  }
}
