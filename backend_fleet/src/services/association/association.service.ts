import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { CompanyDTO } from 'src/classes/dtos/company.dto';
import { GroupDTO } from 'src/classes/dtos/group.dto';
import { UserDTO } from 'src/classes/dtos/user.dto';
import { WorksiteDTO } from 'src/classes/dtos/worksite.dto';
import { AssociationEntity } from 'src/classes/entities/association.entity';
import { CompanyEntity } from 'src/classes/entities/company.entity';
import { UserEntity } from 'src/classes/entities/user.entity';
import { VehicleEntity } from 'src/classes/entities/vehicle.entity';
import { WorksiteEntity } from 'src/classes/entities/worksite.entity';
import Redis from 'ioredis';
import { DataSource, Repository } from 'typeorm';
import { UserService } from '../user/user.service';

/**
 * Struttura pre inviare i dati
 */
interface AssociationDTOData {
  id: number;
  key: string;
  createdAt: Date;
  user: UserDTO;
  company: CompanyDTO;
  worksite: WorksiteDTO;
}

@Injectable()
export class AssociationService {
  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    @InjectRepository(AssociationEntity, 'readOnlyConnection')
    private readonly associationRepository: Repository<AssociationEntity>,
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CompanyEntity, 'readOnlyConnection')
    private readonly companyRepository: Repository<CompanyEntity>,
    @InjectRepository(WorksiteEntity, 'readOnlyConnection')
    private readonly worksiteRepository: Repository<WorksiteEntity>,
    @InjectRedis() private readonly redis: Redis,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  /**
   * Crea una nuova associazione nel database rispettando i criteri dei ruoli e controllando
   * se esiste di gia
   * @param userDTO Utente a cui dare associazione
   * @param worksiteIds lista di id che riguardando cantieri o null
   * @param companyIds lista di id che riguardando società o null
   * @returns
   */
  async createAssociation(
    userDTO: UserDTO,
    worksiteIds: number[] | null,
    companyIds: number[] | null,
  ): Promise<AssociationDTOData[]> {
    // recupero utente
    const user = await this.userRepository.findOne({
      where: { id: userDTO.id },
      relations: {
        role: true,
      },
    });
    if (!user)
      throw new HttpException('Utente non trovato', HttpStatus.NOT_FOUND);
    const companies: CompanyEntity[] = [];
    const worksites: WorksiteEntity[] = [];
    // se utente admin o resposabile si possono aggiungere solo company
    if (user.role.name === 'Admin' || user.role.name === 'Responsabile') {
      if (worksiteIds && worksiteIds.length > 0) {
        throw new HttpException(
          'Non puoi inserire il cantiere per questo utente',
          HttpStatus.FORBIDDEN,
        );
      }
      if (companyIds && companyIds.length > 0) {
        for (const companyId of companyIds) {
          const company = await this.companyRepository.findOne({
            where: {
              id: companyId,
            },
          });
          if (!company)
            throw new HttpException(
              `Società con id: ${companyId} non trovata`,
              HttpStatus.NOT_FOUND,
            );
          companies.push(company);
        }
      } else
        throw new HttpException(
          `Inserisci almeno 1 società`,
          HttpStatus.BAD_REQUEST,
        );
    }
    // se utente capo cantiere si puo soltanto aggiungere un nuovo cantiere
    else if (user.role.name === 'Capo Cantiere') {
      if (companyIds && companyIds.length > 0) {
        throw new HttpException(
          'Non puoi inserire una società per questo utente',
          HttpStatus.FORBIDDEN,
        );
      }
      if (worksiteIds && worksiteIds.length > 0) {
        for (const worksiteId of worksiteIds) {
          const worksite = await this.worksiteRepository.findOne({
            where: {
              id: worksiteId,
            },
          });
          if (!worksite)
            throw new HttpException(
              `Cantiere con id: ${worksiteId} non trovato`,
              HttpStatus.NOT_FOUND,
            );
          worksites.push(worksite);
        }
      } else
        throw new HttpException(
          `Inserisci almeno 1 cantiere`,
          HttpStatus.BAD_REQUEST,
        );
    }
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // creo nuova associazione
      const newAssociations: AssociationEntity[] = [];
      if (worksites && worksites.length > 0) {
        for (const worksite of worksites) {
          const exist = await this.associationRepository.findOne({
            where: {
              user: {
                id: user.id,
              },
              worksite: {
                id: worksite.id,
              },
            },
          });
          if (exist) {
            throw new HttpException(
              `Utente già associato al cantiere: ${worksite.name}`,
              HttpStatus.CONFLICT,
            );
          }
          const newAssociation = await queryRunner.manager
            .getRepository(AssociationEntity)
            .create({
              user: user,
              company: null,
              worksite: worksite,
            });
          newAssociations.push(newAssociation);
        }
      } else if (companies && companies.length > 0) {
        for (const company of companies) {
          const exist = await this.associationRepository.findOne({
            where: {
              user: {
                id: user.id,
              },
              company: {
                id: company.id,
              },
            },
          });
          if (exist) {
            throw new HttpException(
              `Utente già associato alla società : ${company.name}`,
              HttpStatus.CONFLICT,
            );
          }
          const newAssociation = await queryRunner.manager
            .getRepository(AssociationEntity)
            .create({
              user: user,
              company: company,
              worksite: null,
            });
          newAssociations.push(newAssociation);
        }
      }
      // salvo nuova associazione
      const save = await queryRunner.manager
        .getRepository(AssociationEntity)
        .save(newAssociations);
      await queryRunner.commitTransaction();
      await this.setVehiclesAssociateAllUsersRedis();
      await this.setVehiclesAssociateAllUsersRedisSet();
      return save.map((association) => this.toDTO(association));
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante inserimento nuova associazione`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Funzione che permette eliminazione di una associaizone dal database
   * @param id identificativo associazione
   * @returns
   */
  async deleteAssociation(id: number): Promise<void> {
    // controllo se esiste
    const exist = await this.associationRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!exist)
      throw new HttpException(
        `Associazione con ID ${id} non trovata`,
        HttpStatus.NOT_FOUND,
      );
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(AssociationEntity).remove(exist);
      await queryRunner.commitTransaction();
      await this.setVehiclesAssociateAllUsersRedis();
      await this.setVehiclesAssociateAllUsersRedisSet();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante eliminazione associazione`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Recupera tutte le associazioni dal database
   * @returns
   */
  async getAllAssociation(): Promise<AssociationDTOData[]> {
    try {
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
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante il recupero delle associazioni`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera le associazioni in base all utente passato e recupero anche i cantieri/società liberi da poter assegnare
   * @param userId user id
   * @returns
   */
  async getAssociationsById(userId: number): Promise<{
    associations: AssociationDTOData[];
    worksiteFree?: WorksiteEntity[];
    companyFree?: CompanyEntity[];
  }> {
    try {
      // recupero utente e associazioni in parallelo
      const [user, associations] = await Promise.all([
        this.userRepository.findOne({
          select: { id: true, role: { id: true } }, // Seleziona solo ciò che serve
          where: { id: userId },
          relations: { role: true },
        }),
        this.associationRepository.find({
          where: { user: { id: userId } },
          relations: {
            // Includi le relazioni necessarie per il DTO e la logica successiva
            user: { role: true },
            company: true,
            worksite: {
              group: {
                company: true,
              },
            },
          },
          order: { id: 'ASC' },
        }),
      ]);
      const associationsDTO = associations.map((association) =>
        this.toDTO(association),
      );
      let worksiteFree: WorksiteEntity[] | undefined = undefined;
      let companyFree: CompanyEntity[] | undefined = undefined;

      //se utente non esiste
      if (!user) {
        return {
          associations: associationsDTO,
          worksiteFree,
          companyFree,
        };
      }

      const roleId = user.role.id;
      // utente Capo Cantiere
      if (roleId === 3) {
        const worksites = await this.worksiteRepository.find({
          select: {
            id: true,
            name: true,
            group: {
              id: true,
              name: true,
              company: {
                id: true,
                name: true,
              },
            },
          },
          relations: {
            group: {
              company: true,
            },
          },
        });
        // se ci sono associazioni
        const associatedWorksiteIds = new Set(
          associations
            .map((association) => association.worksite?.id)
            .filter((id): id is number => id !== null && id !== undefined),
        );
        // filtro e rimuovo i cantieri già associati
        worksiteFree = worksites.filter(
          (worksite) => !associatedWorksiteIds.has(worksite.id), // <-- Cosa succede qui?
        );
      }
      // utente admin oppure Responsabile
      else if (roleId === 1 || roleId === 2) {
        const companies = await this.companyRepository.find({
          select: {
            id: true,
            name: true,
          },
        });
        const associatedCompanyIds = new Set(
          associations
            .map((association) => association.company?.id)
            .filter((id): id is number => id !== null && id !== undefined),
        );
        // Filtra le società totali per ottenere solo quelle non associate
        companyFree = companies.filter(
          (company) => !associatedCompanyIds.has(company.id),
        );
      }
      return {
        associations: associationsDTO,
        worksiteFree,
        companyFree,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante il recupero delle associazioni`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
          vehicle: { worksite: true }, // Carica i veicoli associati al worksite
        },
        company: {
          group: {
            worksite: {
              vehicle: { worksite: true }, // Carica i veicoli associati al worksite nel gruppo
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

    const vehicles = new Set<VehicleEntity>(); // Set per evitare duplicati

    // recupero i veicoli sono una volta, recuperando soltanto quelli che non sono stati dismessi
    associations.forEach((association) => {
      // Prendo i veicoli se sono direttamente associati al worksite
      if (association.worksite?.vehicle) {
        association.worksite.vehicle
          .filter((vehicle) => vehicle.retired_event === null)
          .forEach((vehicle) => vehicles.add(vehicle));
      }

      // Se c'è un gruppo associato alla company
      if (association?.company?.group) {
        // Se il gruppo è un array, itero su ciascun gruppo
        const groups = Array.isArray(association.company.group)
          ? association.company.group
          : [association.company.group];

        groups.forEach((group) => {
          // Se anche worksite è un array, itero su ciascun worksite
          if (Array.isArray(group.worksite)) {
            group.worksite.forEach((worksite) => {
              if (worksite?.vehicle) {
                worksite.vehicle
                  .filter((vehicle) => vehicle.retired_event === null)
                  .forEach((vehicle) => vehicles.add(vehicle));
              }
            });
          }
        });
      }
    });

    return Array.from(vehicles); // Restituisco l'array di veicoli senza duplicati
  }

  /**
   * Recupera i veicoli associati in base all'id utente su redis, se non trova li prende
   * dalla funzione passando per il db
   * @param userId id utente
   * @returns
   */
  async getVehiclesAssociateUserRedis(
    userId: number,
  ): Promise<VehicleEntity[]> {
    const key = `vehicleAssociateUser:${userId}`;
    const data = await this.redis.get(key);

    if (data) {
      try {
        return JSON.parse(data) as VehicleEntity[];
      } catch (error) {
        console.error('Errore nella conversione dei dati da Redis:', error);
        return [];
      }
    }
    return await this.getVehiclesByUserRole(userId);
  }

  /**
   * imposta su redis tutti i veicoli associati per ogni utente
   */
  async setVehiclesAssociateAllUsersRedis(): Promise<void> {
    try {
      const keys = await this.redis.keys('vehicleAssociateUser:*');
      if (keys.length > 0) {
        await this.redis.del(keys);
      }

      const users = await this.userService.getAllUsers(false);
      const pipeline = this.redis.pipeline();

      for (const user of users) {
        try {
          const vehicles = await this.getVehiclesByUserRole(user.id);
          if (vehicles.length === 0) continue;
          const key = `vehicleAssociateUser:${user.id}`;
          pipeline.set(key, JSON.stringify(vehicles));
        } catch (error) {
          console.log(
            `Errore nel recupero veicoli per l'utente ${user.id}:`,
            error,
          );
        }
      }
      await pipeline.exec();
    } catch (error) {
      console.log('Errore generale:', error);
    }
  }

  /**
   * inserisce su redis le associazioni dei veid ad ogni utente
   */
  async setVehiclesAssociateAllUsersRedisSet(): Promise<void> {
    try {
      const keys = await this.redis.keys('vehicleAssociateUserSet:*');
      if (keys.length > 0) {
        await this.redis.del(keys);
      }

      const users = await this.userService.getAllUsers(false);
      const pipeline = this.redis.pipeline();

      for (const user of users) {
        try {
          const vehicles = await this.getVehiclesByUserRole(user.id);
          const veIds = vehicles.map((vehicle) => vehicle.veId);

          if (veIds.length === 0) continue;

          const key = `vehicleAssociateUserSet:${user.id}`;
          pipeline.sadd(key, ...veIds);
        } catch (error) {
          console.log(
            `Errore set Redis associazione veicoli con l'utente ${user.id}:`,
            error,
          );
        }
      }

      await pipeline.exec();
    } catch (error) {
      console.log('Errore generale:', error);
    }
  }

  /**
   * controlla se un utente ha il veid passato assegnato su redis
   * @param userId user id
   * @param veId identificativo veicolo
   * @returns
   */
  async hasVehiclesAssociateUserRedisSet(
    userId: number,
    veId: number,
  ): Promise<boolean> {
    const key = `vehicleAssociateUserSet:${userId}`;

    // Controlla se l'ID del veicolo (veId) è presente nel Set associato all'utente
    const exists = await this.redis.sismember(key, veId);

    return exists === 1;
  }

  /**
   * Controlla se un utente ha dei veicoli associati e ritorno un array di veId
   * @param userId id utente
   * @returns veId array
   */
  async getVehiclesRedisAllSet(userId: number): Promise<number[]> {
    const key = `vehicleAssociateUserSet:${userId}`;
    const set = await this.redis.smembers(key);
    if (set?.length === 0) {
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    }
    return set.map(Number);
  }

  /**
   * Controlla se un utente ha il permesso di visualizzare un determinato veicolo
   * @param userId id utente
   * @param veId identificativo veicolo
   * @returns
   */
  async checkVehicleAssociateUserSet(
    userId: number,
    veId: number,
  ): Promise<boolean> {
    // recupero i veicoli mappati
    const flag = await this.hasVehiclesAssociateUserRedisSet(userId, veId);
    if (!flag)
      throw new HttpException(
        'Non hai il permesso di visualizzare questo veicolo',
        HttpStatus.FORBIDDEN,
      );
    return true;
  }

  /**
   * Crea la risposta corretta per il frontend
   * @param association oggetto di ritorno dal database
   * @returns
   */
  private toDTO(association: AssociationEntity): AssociationDTOData {
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
      if (association.worksite?.group) {
        worksiteDTO.group = new GroupDTO();
        worksiteDTO.group.id = association.worksite.group.id;
        worksiteDTO.group.name = association.worksite.group.name;
        worksiteDTO.group.company = new CompanyDTO();
        worksiteDTO.group.company.id = association.worksite.group.company.id;
        worksiteDTO.group.company.name =
          association.worksite.group.company.name;
        worksiteDTO.group.company.suId =
          association.worksite.group.company.suId;
      }
    }

    const data: AssociationDTOData = {
      id: association.id,
      key: association.key,
      createdAt: association.createdAt,
      user: userDTO,
      company: companyDTO,
      worksite: worksiteDTO,
    };
    return data;
  }
}
