import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserDTO } from 'classes/dtos/user.dto';
import { RoleEntity } from 'classes/entities/role.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { RoleService } from '../role/role.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly roleService: RoleService,
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
        role: role,
      });
      await queryRunner.manager.getRepository(UserEntity).save(newUser);
      await queryRunner.commitTransaction();
      return newUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      throw new HttpException(
        `Errore durante la creazione del'utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Ritorna tutti gli utenti
   * @returns Utenti
   */
  async getAllUsers(): Promise<UserDTO[]> {
    try {
      const users = await this.userRepository.find({
        relations: {
          role: true,
        },
        order: {
          id: 'ASC',
        },
      });
      const usersDTO = await this.formatUserDTO(users, true);
      return usersDTO;
    } catch (error) {
      console.error(error);
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
      });
      if (!user) return null;
      const userDTO = await this.formatUserDTO(user, false);
      return userDTO;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        `Errore durante recupero dell'utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ritorna utente in base all'id
   * @param id id utente
   * @returns oggetto utente
   */
  async getUserById(id: number): Promise<UserDTO | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: id },
        relations: {
          role: true,
        },
      });
      if (!user) return null;
      const userDTO = await this.formatUserDTO(user, false);
      return userDTO;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        `Errore durante recupero dell'utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Servizio per update utente nel database
   * @param userId id utente
   * @param userDTO nuovi dati da aggiornare
   */
  async updateUser(userId: number, userDTO: UserDTO) {
    const user = await this.checkUser(userId);

    const updateUser = {
      email: userDTO.email || user.email,
      name: userDTO.name || user.name,
      surname: userDTO.surname || user.surname,
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
      console.error(error);
      throw new HttpException(
        `Errore durante l'aggiornamento utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Servizio per aggiornare la password utente
   * @param userId user id
   * @param currentPassword password attuale
   * @param newPassword password nuova
   */
  async updateUserPsw(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.checkUser(userId);
    const bcrypt = require('bcrypt');

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordMatch)
      throw new HttpException(
        'Password attuale errata',
        HttpStatus.UNAUTHORIZED,
      );
    if (currentPassword.toLowerCase() === newPassword.toLowerCase())
      throw new HttpException(
        'Password attuale uguale alla precedente!',
        HttpStatus.BAD_REQUEST,
      );

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(UserEntity).update(
        {
          key: user.key,
        },
        { password: hashPassword },
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      throw new HttpException(
        `Errore durante l'aggiornamento utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Servizio per aggiornare i dati di un utente, soltanto da admin
   * @param userId user id
   * @param userDTO nuovi dati utente
   */
  async updateUserForAdmin(userId: number, userDTO: UserDTO) {
    const user = await this.checkUser(userId);
    if (user.username === 'admin')
      throw new HttpException(
        'Utente Admin non puo essere aggiornato',
        HttpStatus.UNAUTHORIZED,
      );
    const role = await this.roleService.getRoleByName(userDTO.role);
    if (!role)
      throw new HttpException('Ruolo non trovato', HttpStatus.NOT_FOUND);
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(userDTO.password, salt);
    const regex = /\d/;
    if (!userDTO.username || regex.test(userDTO.username))
      throw new HttpException(
        'Inserisci un username valido, non vuoto e non devono esserci numeri',
        HttpStatus.BAD_REQUEST,
      );

    const updateUser = {
      username: userDTO.username || user.username,
      email: userDTO.email || user.email,
      name: userDTO.name || user.name,
      surname: userDTO.surname || user.surname,
      password: hashPassword || user.password,
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
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
      throw new HttpException(
        `Errore durante l'aggiornamento utente`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina utente dal database
   * @param userId user id
   */
  async deleteUser(userId: number) {
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
      await queryRunner.manager.getRepository(UserEntity).remove(user);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(error);
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
  ): Promise<any> {
    const usersArray = Array.isArray(user) ? user : [user];
    const usersDTO = usersArray.map((user) => {
      const userDTO = new UserDTO();
      if (admin) {
        userDTO.id = user.id;
        userDTO.createdAt = user.createdAt;
        userDTO.updatedAt = user.updatedAt;
        userDTO.version = user.version;
        userDTO.email = user.email;
        userDTO.name = user.name;
        userDTO.surname = user.surname;
        userDTO.username = user.username;
        userDTO.role = user.role.name;
        return userDTO;
      } else {
        userDTO.id = user.id;
        userDTO.email = user.email;
        userDTO.name = user.name;
        userDTO.surname = user.surname;
        userDTO.username = user.username;
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
      relations: ['role'],
    });
    if (!user)
      throw new HttpException(
        `Utente con ID ${userId} non trovato`,
        HttpStatus.NOT_FOUND,
      );
    return user;
  }
}
