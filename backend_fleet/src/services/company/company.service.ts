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
  async getAllCompany(): Promise<CompanyEntity[]> {
    const companies = await this.companyEntity.find();
    return companies;
  }

  /**
   * Ritorna la società in base all'id passato
   * @param id identificativo società
   * @returns
   */
  async getCompanyById(id: number): Promise<CompanyEntity> {
    const company = await this.companyEntity.findOne({
      where: {
        id: id,
      },
    });
    return company;
  }

  /**
   * Ritorna l'oggetto società
   * @param veId Ricerca in base all veId del veicolo
   * @returns
   */
  async getCompanyByVeId(veId): Promise<CompanyEntity> {
    const company = await this.companyEntity.findOne({
      where: {
        group: {
          worksite: {
            vehicle: {
              veId: veId,
            },
          },
        },
      },
    });
    return company;
  }

  /**
   * Ritorna l'oggetto società
   * @param veId Ricerca in base all vgId del gruppo
   * @returns
   */
  async getCompanyByVgId(vgId): Promise<CompanyEntity> {
    const company = await this.companyEntity.findOne({
      where: {
        group: {
          vgId: vgId,
        },
      },
      relations: {
        group: true,
      },
    });
    return company;
  }
}
