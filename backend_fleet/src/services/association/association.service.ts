import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CommonDTO } from 'classes/common/common.dto';
import { CompanyDTO } from 'classes/dtos/company.dto';
import { UserDTO } from 'classes/dtos/user.dto';
import { WorksiteDTO } from 'classes/dtos/worksite.dto';
import { AssociationEntity } from 'classes/entities/association.entity';
import { CompanyEntity } from 'classes/entities/company.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import Redis from 'ioredis';
import { DataSource, Repository } from 'typeorm';
import { UserService } from '../user/user.service';

@Injectable()
export class AssociationService {
  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    @InjectRepository(AssociationEntity, 'readOnlyConnection')
    private readonly associationRepository: Repository<AssociationEntity>,
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    @InjectRedis() private readonly redis: Redis,
    private readonly userService: UserService,
  ) {}

  /**
   * Crea una nuova associazione nel database rispettando i criteri dei ruoli e controllando
   * se esiste di gia
   * @param userDTO Utente a cui dare associazione
   * @param company Oggetto società oppure null
   * @param worksite Oggetto cantiere oppure null
   * @returns
   */
  async createAssociation(
    userDTO: UserDTO,
    company: CompanyEntity | null,
    worksite: WorksiteEntity | null,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userDTO.id },
    });
    // se company non è null allora utente è admin o responsabile
    if (company) {
      const exist = await this.associationRepository.findOne({
        where: {
          user: {
            key: user.key,
          },
          company: {
            key: company.key,
          },
        },
      });
      // se esiste non inserisco
      if (exist) return null;
    }
    // se company è null e worksite non null allora utente capo cantiere
    else if (worksite) {
      const exist = await this.associationRepository.findOne({
        where: {
          user: {
            key: user.key,
          },
          worksite: {
            key: worksite.key,
          },
        },
      });
      // se esiste non inserisco
      if (exist) return null;
    }
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // creo nuova associazione
      const newAssociation = await queryRunner.manager
        .getRepository(AssociationEntity)
        .create({
          user: user,
          company: company,
          worksite: worksite,
        });
      // salvo nuova associazione
      await queryRunner.manager
        .getRepository(AssociationEntity)
        .save(newAssociation);
    } catch (error) {
      console.error('Errore inserimento nuova associazione: ' + error);
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    } finally {
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }
    await this.setVehiclesAssociateAllUsersRedis();
    return true;
  }

  /**
   * Funzione che permette eliminazione di una associaizone dal database
   * @param id identificativo associazione
   * @returns
   */
  async deleteAssociation(id: number): Promise<boolean> {
    // controllo se esiste
    const exist = await this.associationRepository.findOne({
      where: {
        id: id,
      },
    });
    // se non esiste ritorno null, se esiste faccio remove
    if (!exist) return null;
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(AssociationEntity).remove(exist);
    } catch (error) {
      console.error('Errore eliminazione associazione: ' + error);
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    } finally {
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }
    await this.setVehiclesAssociateAllUsersRedis();
    return true;
  }
  /**
   * Recupera tutte le associazioni dal database
   * @returns
   */
  async getAllAssociation(): Promise<AssociationEntity[]> {
    const associations = await this.associationRepository.find({
      relations: {
        user: {
          role: true,
        },
        company: true,
        worksite: true,
      },
    });

    return associations.map((association) => this.toDTO(association));
  }

  /**
   * Funzione che recupera i veicoli che un utente può visualizzare, in base al suo ruolo di assegnazione
   * @param userid User id
   * @returns Veicoli
   */
  async getVehiclesByUserRole(userid: number): Promise<VehicleEntity[]> {
    const associations = await this.associationRepository.find({
      where: {
        user: {
          id: userid,
        },
      },
      relations: {
        worksite: {
          vehicle: true,
        },
        company: {
          group: {
            worksite_group: {
              worksite: {
                vehicle: true,
              },
            },
          },
        },
      },
      order: {
        company: {
          group: {
            id: 'ASC',
          },
        },
      },
    });
    const vehicles = new Set<VehicleEntity>();
    associations.forEach((association) => {
      // Prendo i veicoli se hanno direttamente associazione con worksite
      if (association.worksite?.vehicle) {
        association.worksite.vehicle.forEach((vehicle) =>
          vehicles.add(vehicle),
        );
      }
      // Prendo tutti i veicoli passando da company -> group -> worksite_group -> worksite considerando soltanto il comune principale per evitare duplicati
      if (association.company?.group) {
        const firstGroup = association.company.group[0];
        if (firstGroup.worksite_group) {
          firstGroup.worksite_group.forEach((worksiteGroup) => {
            if (worksiteGroup.worksite?.vehicle) {
              worksiteGroup.worksite.vehicle.forEach((vehicle) =>
                vehicles.add(vehicle),
              );
            }
          });
        }
      }
    });
    return Array.from(vehicles);
  }

  /**
   * Recupera i veicoli associati in base all'id utente su redis, se non trova li prende
   * dalla funzione passando per il db
   * @param userid id utente
   * @returns
   */
  async getVehiclesAssociateUserRedis(
    userid: number,
  ): Promise<VehicleEntity[]> {
    const key = `vehicleAssociateUser:${userid}`;
    const data = await this.redis.get(key);

    if (data) {
      try {
        return JSON.parse(data) as VehicleEntity[];
      } catch (error) {
        console.error('Errore nella conversione dei dati da Redis:', error);
        return [];
      }
    }
    return await this.getVehiclesByUserRole(userid);
  }

  /**
   * imposta su redis tutti i veicoli associati per ogni utente
   */
  async setVehiclesAssociateAllUsersRedis() {
    try {
      const users = await this.userService.getAllUsers();

      const promises = users.map(async (user) => {
        const key = `vehicleAssociateUser:${user.id}`;
        const vehicles = await this.getVehiclesByUserRole(user.id);

        try {
          await this.redis.set(key, JSON.stringify(vehicles));
        } catch (error) {
          console.log(
            `Errore set Redis associazione veicoli con l'utente ${user.id}:`,
            error,
          );
        }
      });
      await Promise.all(promises);
    } catch (error) {
      console.log('Errore generale:', error);
    }
  }

  /**
   * Crea la risposta corretta per il frontend
   * @param association oggetto di ritorno dal database
   * @returns
   */
  private toDTO(association: AssociationEntity): any {
    const commonDTO = new CommonDTO();
    commonDTO.id = association.id;
    commonDTO.createdAt = association.createdAt;

    const userDTO = new UserDTO();
    userDTO.id = association.user.id;
    userDTO.username = association.user.username;
    userDTO.role = association.user.role.name;

    let companyDTO: CompanyDTO | null = null;
    if (association.company) {
      companyDTO = new CompanyDTO();
      companyDTO.id = association.company.id;
      companyDTO.suId = association.company.suId;
      companyDTO.name = association.company.name;
    }

    // Crea WorksiteDTO se esiste il worksite
    let worksiteDTO: WorksiteDTO | null = null;
    if (association.worksite) {
      worksiteDTO = new WorksiteDTO();
      worksiteDTO.id = association.worksite.id;
      worksiteDTO.name = association.worksite.name;
    }

    return {
      ...commonDTO,
      user: userDTO,
      company: companyDTO,
      worksite: worksiteDTO,
    };
  }
}
