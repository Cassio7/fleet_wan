import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserDTO } from 'src/classes/dtos/user.dto';
import { AssociationEntity } from 'src/classes/entities/association.entity';
import { RoleEntity } from 'src/classes/entities/role.entity';
import { UserEntity } from 'src/classes/entities/user.entity';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DataSource, Repository } from 'typeorm';
import { AssociationService } from '../association/association.service';
import { AuthService } from '../auth/auth.service';
import { RoleService } from '../role/role.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(AssociationEntity, 'readOnlyConnection')
    private readonly associationRepository: Repository<AssociationEntity>,
    private readonly roleService: RoleService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => AssociationService))
    private readonly associationService: AssociationService,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Servizio per la creazione nuovo utente
   * @param user User DTO
   * @returns
   */
  async createUser(user: UserDTO): Promise<UserEntity> {
    const regex = /\d/;
    if (!user.username || regex.test(user.username))
      throw new HttpException(
        'Inserisci un username valido, non vuoto e non devono esserci numeri',
        HttpStatus.BAD_REQUEST,
      );
    const exist = await this.getUserByUsername(user.username);
    const role: RoleEntity = await this.roleService.getRoleByName(user.role);
    if (exist)
      throw new HttpException(
        'Username esistente, scegline un altro',
        HttpStatus.CONFLICT,
      );

    if (!role)
      throw new HttpException('Ruolo non trovato', HttpStatus.NOT_FOUND);
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const newUser = queryRunner.manager.getRepository(UserEntity).create({
        name: user.name,
        surname: user.surname,
        username: user.username,
        email: user.email,
        password: user.password,
        active: true,
        role: role,
      });
      await queryRunner.manager.getRepository(UserEntity).save(newUser);
      await queryRunner.commitTransaction();
      return this.formatUserDTO(newUser, true);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante la creazione dell'utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Ritorna tutti gli utenti
   * @param logged boolean per ricercare utenti loggati
   * @returns
   */
  async getAllUsers(logged: boolean): Promise<UserDTO[]> {
    try {
      if (logged) {
        const users = await this.userRepository.find({
          relations: {
            role: true,
          },
          order: {
            id: 'ASC',
          },
          withDeleted: true,
        });
        const loggedMap = await this.authService.getLoggedUsersMap();
        return await this.formatUserDTO(users, true, loggedMap);
      } else {
        const users = await this.userRepository.find({
          relations: {
            role: true,
          },
          order: {
            id: 'ASC',
          },
        });
        return await this.formatUserDTO(users, true);
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero degli utenti`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  /**
   * Ritorna un utente in base all'username, se esiste
   * @param username username dell'utente
   * @returns ritorna oggetto utente
   */
  async getUserByUsername(username: string): Promise<UserDTO | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { username: username },
        relations: {
          role: true,
        },
        withDeleted: true,
      });
      if (!user) return null;
      return await this.formatUserDTO(user, false);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dell'utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ritorna utente in base all'id
   * @param id id utente
   * @param admin indica se la richiesta viene fatta dall'admin per avere più dati di ritorno
   * @returns oggetto utente
   */
  async getUserById(id: number, admin: boolean): Promise<UserDTO | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
        relations: {
          role: true,
        },
      });
      if (!user) return null;
      return await this.formatUserDTO(user, admin);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dell'utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Servizio per aggiornare la i dati utente, soltanto per modificare proprio account
   * @param userId id utente
   * @param currentPassword password attuale utente
   * @param userDTO nuovi dati da aggiornare per utente
   */
  async updateUser(
    userId: number,
    currentPassword: string,
    userDTO: UserDTO,
  ): Promise<UserDTO> {
    const user = await this.checkUser(userId);
    let hashPassword = null;
    if (currentPassword) {
      const isPasswordMatch = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordMatch)
        throw new HttpException(
          'Password attuale errata',
          HttpStatus.UNAUTHORIZED,
        );
      const newPassword = userDTO.password;
      if (newPassword) {
        if (currentPassword.toLowerCase() === newPassword.toLowerCase())
          throw new HttpException(
            'Password attuale uguale alla precedente!',
            HttpStatus.BAD_REQUEST,
          );
        // Controllo sulla sicurezza della password
        const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_])(?=.{8,})/;
        if (!passwordRegex.test(newPassword)) {
          throw new HttpException(
            'La password deve contenere almeno 8 caratteri, una lettera maiuscola e un simbolo speciale.',
            HttpStatus.BAD_REQUEST,
          );
        }
        const salt = await bcrypt.genSalt(10);
        hashPassword = await bcrypt.hash(newPassword, salt);
      }
    }

    const updateUser = {
      email: userDTO.email || user.email,
      name: userDTO.name || user.name,
      surname: userDTO.surname || user.surname,
      password: hashPassword || user.password,
    };
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(UserEntity).update(
        {
          key: user.key,
        },
        updateUser,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante l'aggiornamento utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
    return await this.getUserById(userId, false);
  }

  /**
   * Servizio per aggiornare i dati di un utente, soltanto da admin
   * @param userId user id
   * @param userDTO nuovi dati utente
   */
  async updateUserForAdmin(userId: number, userDTO: UserDTO): Promise<UserDTO> {
    const user = await this.checkUser(userId);
    if (user.username === 'admin')
      throw new HttpException(
        'Utente Admin non puo essere aggiornato',
        HttpStatus.UNAUTHORIZED,
      );
    let role = null;
    if (userDTO.role != undefined) {
      role = await this.roleService.getRoleByName(userDTO.role);
      if (!role)
        throw new HttpException('Ruolo non trovato', HttpStatus.NOT_FOUND);
    }
    let hashPassword = null;
    if (userDTO.password) {
      const salt = await bcrypt.genSalt(10);
      hashPassword = await bcrypt.hash(userDTO.password, salt);
    }
    const regex = /[0-9\s]/; // Controlla se ci sono numeri o spazi
    const regexPunto = /\./; // Controlla se c'è almeno un punto

    if (userDTO.username) {
      // Controlla se l'username contiene numeri o spazi
      if (regex.test(userDTO.username)) {
        throw new HttpException(
          'Inserisci un username valido, non devono esserci numeri o spazi',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Controlla se l'username contiene almeno un punto
      if (!regexPunto.test(userDTO.username)) {
        throw new HttpException(
          'Inserisci un username valido, deve contenere almeno un punto',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updateUser = {
      username: userDTO.username || user.username,
      email: userDTO.email || user.email,
      name: userDTO.name || user.name,
      surname: userDTO.surname || user.surname,
      password: hashPassword || user.password,
      active: userDTO.active ?? user.active,
      role: role || user.role,
    };
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(UserEntity).update(
        {
          key: user.key,
        },
        updateUser,
      );
      // se il ruolo è stato cambiato rimuovo tutte le associazioni del vecchio ruolo
      if (role && user.role.id !== role?.id) {
        const associationsRemove = await this.associationRepository.find({
          where: {
            user: {
              id: user.id,
            },
          },
        });
        await queryRunner.manager
          .getRepository(AssociationEntity)
          .remove(associationsRemove);
        await this.associationService.setVehiclesAssociateAllUsersRedis();
        await this.associationService.setVehiclesAssociateAllUsersRedisSet();
      }
      await queryRunner.commitTransaction();
      if (userDTO.active != null && userDTO.active != user.active) {
        await this.authService.setActive(user.key, userDTO.active);
        if (!userDTO.active)
          this.notificationsService.sendNotificationToUser(
            user.key,
            'suspended',
          );
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante l'aggiornamento utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
    return await this.getUserById(userId, true);
  }

  /**
   * Elimina utente dal database
   * @param userId user id
   */
  async deleteUser(userId: number): Promise<void> {
    const user = await this.checkUser(userId);
    if (user.username === 'admin')
      throw new HttpException(
        'Utente Admin non puo essere eliminato',
        HttpStatus.UNAUTHORIZED,
      );
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager
        .getRepository(UserEntity)
        .update({ key: user.key }, { active: false });
      await queryRunner.manager
        .getRepository(UserEntity)
        .softDelete({ key: user.key });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante eliminazione utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Formatta l'output per la visualizzazione nel frontend
   * @param user Oggetto UserEntity che deve essere filtrato
   * @param admin Variabile che cambia il tipo di ritorno in base all utente
   * @returns
   */
  private async formatUserDTO(
    user: UserEntity | UserEntity[],
    admin: boolean,
    loggedMap?: Map<string, { token: string; clientId: string[] }>,
  ): Promise<any> {
    const usersArray = Array.isArray(user) ? user : [user];
    const usersDTO = usersArray.map((user) => {
      const userDTO = new UserDTO();
      if (admin) {
        userDTO.id = user.id;
        userDTO.key = user.key;
        userDTO.createdAt = user.createdAt;
        userDTO.updatedAt = user.updatedAt;
        userDTO.deletedAt = user.deletedAt;
        userDTO.version = user.version;
        userDTO.email = user.email;
        userDTO.name = user.name;
        userDTO.surname = user.surname;
        userDTO.username = user.username;
        userDTO.active = user.active;
        userDTO.role = user.role.name;
        if (loggedMap?.has(user.key)) {
          userDTO.token = loggedMap.get(user.key).token;
          userDTO.clientId = loggedMap.get(user.key)?.clientId?.[0] || null;
        }
        return userDTO;
      } else {
        userDTO.email = user.email;
        userDTO.name = user.name;
        userDTO.surname = user.surname;
        userDTO.username = user.username;
        userDTO.active = user.active;
        userDTO.role = user.role.name;
        return userDTO;
      }
    });
    return Array.isArray(user) ? usersDTO : usersDTO[0];
  }

  /**
   * controlla se utente loggato esiste
   * @param userId id utente
   * @returns ritorna utente
   */
  async checkUser(userId: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        role: true,
      },
    });
    if (!user)
      throw new HttpException(
        `Utente con ID ${userId} non trovato`,
        HttpStatus.NOT_FOUND,
      );
    return user;
  }
}
