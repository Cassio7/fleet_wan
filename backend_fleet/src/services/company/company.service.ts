import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyDTO } from 'classes/dtos/company.dto';
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
  async getAllCompany(): Promise<CompanyDTO[]> {
    try {
      const companies = await this.companyEntity.find({
        order: {
          id: 'ASC',
        },
        relations: {
          group: {
            worksite: true,
          },
        },
      });
      return companies.map((company) => this.toDTO(company));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle società per admin`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ritorna la società in base all'id passato
   * @param id identificativo società
   * @returns
   */
  async getCompanyById(id: number): Promise<CompanyDTO | null> {
    try {
      const company = await this.companyEntity.findOne({
        where: {
          id: id,
        },
        relations: {
          group: {
            worksite: true,
          },
        },
      });
      return company ? this.toDTO(company) : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero della società`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * USATA SOLO DENTRO SERVER
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
   * Filtra i dati come DTO
   * @param company entità
   * @returns DTO
   */
  private toDTO(company: CompanyEntity): CompanyDTO {
    const companyDTO = new CompanyDTO();
    companyDTO.id = company.id;
    companyDTO.createdAt = company.createdAt;
    companyDTO.updatedAt = company.updatedAt;
    companyDTO.name = company.name;
    companyDTO.suId = company.suId;
    companyDTO.groupCount = company.group.length;
    // If company has multiple groups
    let totalWorksites = 0;
    if (Array.isArray(company.group)) {
      // Multiple groups case
      company.group.forEach((group) => {
        if (group.worksite && Array.isArray(group.worksite)) {
          totalWorksites += group.worksite.length;
        }
      });
    }

    companyDTO.worsksiteCount = totalWorksites;
    return companyDTO;
  }
}
