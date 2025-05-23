import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CompanyDTO } from 'src/classes/dtos/company.dto';
import { GroupDTO } from 'src/classes/dtos/group.dto';
import { VehicleDTO } from 'src/classes/dtos/vehicle.dto';
import { WorksiteDTO } from 'src/classes/dtos/worksite.dto';
import { GroupEntity } from 'src/classes/entities/group.entity';
import { VehicleEntity } from 'src/classes/entities/vehicle.entity';
import { WorksiteEntity } from 'src/classes/entities/worksite.entity';
import { DataSource, In, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';

@Injectable()
export class WorksiteService {
  constructor(
    @InjectRepository(WorksiteEntity, 'readOnlyConnection')
    private readonly worksiteRepository: Repository<WorksiteEntity>,
    @InjectRepository(GroupEntity, 'readOnlyConnection')
    private readonly groupRepository: Repository<GroupEntity>,
    @InjectRepository(VehicleEntity, 'readOnlyConnection')
    private readonly vehicleRepository: Repository<VehicleEntity>,
    private readonly associationService: AssociationService,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  /**
   * Crea un nuovo cantiere se non esiste
   * @param name nome cantiere
   * @param groupId id comune da associare
   * @returns
   */
  async createWorksite(name: string, groupId: number): Promise<WorksiteDTO> {
    const exists = await this.worksiteRepository.findOne({
      where: {
        name: name.trim(),
      },
      withDeleted: true,
    });
    if (exists)
      throw new HttpException(
        'Nome cantiere già inserito',
        HttpStatus.CONFLICT,
      );
    let group: GroupEntity | null = null;
    if (groupId) {
      group = await this.groupRepository.findOne({
        where: {
          id: groupId,
        },
      });
      if (!group)
        throw new HttpException(
          'Non trovato il comune associato',
          HttpStatus.NOT_FOUND,
        );
    }

    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const newWorksite = queryRunner.manager
        .getRepository(WorksiteEntity)
        .create({
          name: name.trim(),
          group: group,
        });
      await queryRunner.manager.getRepository(WorksiteEntity).save(newWorksite);
      await queryRunner.commitTransaction();
      const newWorksiteData = await this.worksiteRepository.findOne({
        where: {
          key: newWorksite.key,
        },
        relations: {
          group: {
            company: true,
          },
        },
      });
      return this.toDTO(newWorksiteData, false);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante la creazione del cantiere`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

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
          id: 'ASC',
        },
      });
      return worksites.map((worksite) => this.toDTO(worksite, false));
    } catch (error) {
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
  async getWorksiteById(id: number): Promise<WorksiteDTO | null> {
    try {
      const worksite = await this.worksiteRepository.findOne({
        where: {
          id: id,
        },
        relations: {
          vehicle: {
            service: true,
          },
          group: {
            company: true,
          },
        },
      });
      return worksite ? this.toDTO(worksite, true) : null;
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero del cantiere`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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

  async updateWorksite(
    worksiteId: number,
    name?: string,
    groupId?: number,
  ): Promise<WorksiteDTO> {
    if (!worksiteId || isNaN(worksiteId) || worksiteId <= 0) {
      throw new HttpException('ID cantiere non valido', HttpStatus.BAD_REQUEST);
    }

    // Recupero il cantiere esistente
    const worksite = await this.worksiteRepository.findOne({
      where: { id: worksiteId },
    });
    if (!worksite) {
      throw new HttpException('Cantiere non trovato', HttpStatus.NOT_FOUND);
    }

    // Oggetto di aggiornamento che conterrà solo i valori modificati
    const updateWorksite = {
      name: name?.trim() || worksite.name,
    };

    // Controllo se il nome è già esistente (se fornito)
    if (name !== undefined && name.trim()) {
      const existingByName = await this.worksiteRepository.findOne({
        where: { name: name.trim() },
      });
      if (existingByName && existingByName.id !== worksiteId) {
        throw new HttpException(
          'Un altro cantiere ha già questo nome',
          HttpStatus.CONFLICT,
        );
      }
      updateWorksite.name = name.trim();
    }

    // Verifica se il gruppo esiste, se fornito
    if (groupId !== undefined) {
      let group: GroupEntity | null = null;
      if (groupId) {
        group = await this.groupRepository.findOne({
          where: { id: groupId },
        });
        if (!group) {
          throw new HttpException(
            'Non trovato il gruppo associato',
            HttpStatus.NOT_FOUND,
          );
        }
      }
      updateWorksite['group'] = group;
    }
    // Aggiungo l'aggiornamento dei campi version e updatedAt
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      //Uso il metodo update per applicare le modifiche
      await queryRunner.manager
        .getRepository(WorksiteEntity)
        .update({ key: worksite.key }, updateWorksite);

      await queryRunner.commitTransaction();

      // Recupero l'oggetto aggiornato
      const updatedWorksite = await this.worksiteRepository.findOne({
        where: { id: worksiteId },
        relations: {
          group: {
            company: true,
          },
        },
      });

      return this.toDTO(updatedWorksite, false);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        "Errore durante l'aggiornamento del cantiere",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Eliminazione cantiere
   * @param worksiteId id del cantiere
   */
  async deleteWorksite(worksiteId: number): Promise<void> {
    const worksite = await this.worksiteRepository.findOne({
      where: {
        id: worksiteId,
      },
    });
    if (!worksite)
      throw new HttpException('Cantiere non trovato', HttpStatus.NOT_FOUND);
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // rimuove associazione al cantiere di riferimento inserendo null
      await this.vehicleRepository.update(
        { worksite: { id: worksite.id } },
        { worksite: null },
      );
      await queryRunner.manager
        .getRepository(WorksiteEntity)
        .softDelete({ key: worksite.key });
      await queryRunner.commitTransaction();
      //update associations
      this.associationService.setVehiclesAssociateAllUsersRedis();
      this.associationService.setVehiclesAssociateAllUsersRedisSet();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante eliminazione cantiere`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }
  /**
   * Formatta oggetto del database in dto
   * @param worksite oggetto entità
   * @returns dto
   */
  private toDTO(worksite: WorksiteEntity, vehicleList: boolean): WorksiteDTO {
    const worksiteDTO = new WorksiteDTO();
    worksiteDTO.id = worksite.id;
    worksiteDTO.createdAt = worksite.createdAt;
    worksiteDTO.updatedAt = worksite.updatedAt;
    worksiteDTO.version = worksite.version;
    worksiteDTO.name = worksite.name;
    worksiteDTO.vehicleCount = worksite.vehicle?.length || 0;
    if (vehicleList) {
      if (!worksiteDTO.vehicle) {
        worksiteDTO.vehicle = []; // Inizializza come array vuoto se è undefined
      }
      worksite.vehicle.map((item) => {
        const newVehicleDTO = new VehicleDTO();
        newVehicleDTO.id = item.id;
        newVehicleDTO.plate = item.plate;
        newVehicleDTO.veId = item.veId;
        newVehicleDTO.allestimento = item.allestimento;
        worksiteDTO.vehicle.push(newVehicleDTO);
      });
    }
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
