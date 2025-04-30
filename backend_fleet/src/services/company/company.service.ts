import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CompanyDTO } from 'src/classes/dtos/company.dto';
import { CompanyEntity } from 'src/classes/entities/company.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(CompanyEntity, 'readOnlyConnection')
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  /**
   * Crea una nuova azienda se non esiste
   * @param suId identificativo univoco della società
   * @param name nome azienda
   * @returns
   */
  async createCompany(suId: number, name: string): Promise<CompanyDTO> {
    if (!suId || isNaN(suId) || suId <= 0) {
      throw new HttpException(
        'suId non valido: deve essere un numero positivo',
        HttpStatus.BAD_REQUEST,
      );
    }
    const exists = await this.companyRepository.findOne({
      where: {
        suId: suId,
      },
    });
    if (exists)
      throw new HttpException(
        'Società con questo suId già esistente',
        HttpStatus.CONFLICT,
      );
    const existingByName = await this.companyRepository.findOne({
      where: { name: name.trim() },
    });
    if (existingByName) {
      throw new HttpException(
        'Nome società già registrato',
        HttpStatus.CONFLICT,
      );
    }

    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const newCompany = queryRunner.manager
        .getRepository(CompanyEntity)
        .create({
          suId: suId,
          name: name.trim(),
        });
      await queryRunner.manager.getRepository(CompanyEntity).save(newCompany);
      await queryRunner.commitTransaction();
      return this.toDTO(newCompany);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        'Errore durante la creazione della società',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Ritorna tutte le società salvate
   * @returns oggetto società
   */
  async getAllCompany(): Promise<CompanyDTO[]> {
    try {
      const companies = await this.companyRepository.find({
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
      const company = await this.companyRepository.findOne({
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
  async getCompanyByVeId(veId: number): Promise<CompanyEntity> {
    const company = await this.companyRepository.findOne({
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
   * Aggiorna un'azienda esistente
   * @param companyId ID dell'azienda da aggiornare
   * @param suId Nuovo suId (opzionale)
   * @param name Nuovo nome dell'azienda (opzionale)
   * @returns Azienda aggiornata
   */
  async updateCompany(
    companyId: number,
    suId?: number,
    name?: string,
  ): Promise<CompanyDTO> {
    // Controllo che companyId sia valido
    if (!companyId || isNaN(companyId) || companyId <= 0) {
      throw new HttpException('ID società non valido', HttpStatus.BAD_REQUEST);
    }

    // Recupero l'azienda esistente
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new HttpException('Società non trovata', HttpStatus.NOT_FOUND);
    }

    // Oggetto di aggiornamento che conterrà solo i valori modificati
    const updateCompany = {
      suId: suId || company.suId,
      name: name?.trim() || company.name,
    };

    // Controllo se suId o name sono già esistenti
    if (suId !== undefined) {
      if (!suId || isNaN(suId) || suId <= 0) {
        throw new HttpException(
          'suId non valido: deve essere un numero positivo',
          HttpStatus.BAD_REQUEST,
        );
      }
      const existingBySuId = await this.companyRepository.findOne({
        where: { suId: suId },
      });
      if (existingBySuId && existingBySuId.id !== companyId) {
        throw new HttpException(
          "Un'altra società ha già questo suId",
          HttpStatus.CONFLICT,
        );
      }
      updateCompany.suId = suId;
    }

    if (name !== undefined && name.trim()) {
      const existingByName = await this.companyRepository.findOne({
        where: { name: name.trim() },
      });
      if (existingByName && existingByName.id !== companyId) {
        throw new HttpException(
          "Un'altra società ha già questo nome",
          HttpStatus.CONFLICT,
        );
      }
      updateCompany.name = name.trim();
    }

    // Aggiungo l'aggiornamento dei campi version e updatedAt
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Uso il metodo update per applicare le modifiche
      await queryRunner.manager
        .getRepository(CompanyEntity)
        .update({ key: company.key }, updateCompany);

      await queryRunner.commitTransaction();

      // Recupero l'oggetto aggiornato
      const updatedCompany = await this.companyRepository.findOne({
        where: { id: companyId },
      });

      return this.toDTO(updatedCompany);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Errore durante l'aggiornamento della società",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina un'azienda se esiste
   * @param companyId identificativo della società
   */
  async deleteCompany(companyId: number): Promise<void> {
    const company = await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
    });
    if (!company) {
      throw new HttpException(
        'Non trovata la società associata',
        HttpStatus.NOT_FOUND,
      );
    }

    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(CompanyEntity).remove(company);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Errore durante l'eliminazione della società",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
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
    companyDTO.version = company.version;
    companyDTO.name = company.name;
    companyDTO.suId = company.suId;
    companyDTO.groupCount = company.group?.length || 0;
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
