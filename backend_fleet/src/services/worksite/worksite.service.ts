import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompanyDTO } from 'classes/dtos/company.dto';
import { GroupDTO } from 'classes/dtos/group.dto';
import { WorksiteDTO } from 'classes/dtos/worksite.dto';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { In, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';

@Injectable()
export class WorksiteService {
  constructor(
    @InjectRepository(WorksiteEntity, 'readOnlyConnection')
    private readonly worksiteRepository: Repository<WorksiteEntity>,
    private readonly associationService: AssociationService,
  ) {}

  /**
   * Ritorna tutti i cantieri nel db
   * @returns oggetto DTO
   */
  async getWorksiteAdmin(): Promise<WorksiteDTO[]> {
    try {
      const worksites = await this.worksiteRepository.find({
        relations: {
          vehicle: true,
          group: {
            company: true,
          },
        },
        order: {
          name: 'ASC',
        },
      });
      return worksites.map((worksite) => this.toDTO(worksite));
    } catch (error) {
      console.error(error);

      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dei cantieri per admin`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ritorna oggetto cantiere in base all id passato
   * @param id identificativo cantiere
   * @returns
   */
  async getWorksiteById(id: number): Promise<WorksiteEntity> {
    const worksite = await this.worksiteRepository.findOne({
      where: {
        id: id,
      },
    });
    return worksite;
  }
  /**
   * Recupera i cantieri associati in base all'utente che li richiede
   * @param userId id utente
   * @returns
   */
  async getWorksitesByUser(userId: number): Promise<WorksiteEntity[]> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
      const worksites = await this.worksiteRepository.find({
        select: {
          id: true,
          name: true,
        },
        where: {
          vehicle: {
            veId: In(veIdArray),
          },
        },
        order: {
          name: 'ASC',
        },
      });
      return worksites;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante il recupero dei cantieri dato id utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Formatta oggetto del database in dto
   * @param worksite oggetto entità
   * @returns dto
   */
  private toDTO(worksite: WorksiteEntity): WorksiteDTO {
    const worksiteDTO = new WorksiteDTO();
    worksiteDTO.id = worksite.id;
    worksiteDTO.createdAt = worksite.createdAt;
    worksiteDTO.updatedAt = worksite.updatedAt;
    worksiteDTO.name = worksite.name;
    worksiteDTO.vehicleCount = worksite.vehicle.length;
    if (worksite.group) {
      worksiteDTO.group = new GroupDTO();
      worksiteDTO.group.id = worksite.group.id;
      worksiteDTO.group.vgId = worksite.group.vgId;
      worksiteDTO.group.name = worksite.group.name;

      const company = worksite.group?.company;
      if (company) {
        worksiteDTO.group.company = new CompanyDTO();
        worksiteDTO.group.company.id = company.id;
        worksiteDTO.group.company.suId = company.suId;
        worksiteDTO.group.company.name = company.name;
      }
    }

    return worksiteDTO;
  }
}
