import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { In, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';
import { WorksiteDTO } from 'classes/dtos/worksite.dto';
import { GroupDTO } from 'classes/dtos/group.dto';
import { CompanyDTO } from 'classes/dtos/company.dto';

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
          worksite_group: {
            group: {
              company: true,
            },
          },
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
    if (worksite.worksite_group && worksite.worksite_group.length > 0) {
      for (const item of worksite.worksite_group) {
        if (item.group?.name && !item.group.name.includes('Comuni')) {
          worksiteDTO.group = new GroupDTO();
          worksiteDTO.group.id = item.group.id;
          worksiteDTO.group.vgId = item.group.vgId;
          worksiteDTO.group.name = item.group.name;
          break;
        }
      }

      const company = worksite.worksite_group[0]?.group?.company;
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
