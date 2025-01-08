import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { UserDTO } from 'classes/dtos/user.dto';
import { UserEntity } from 'classes/entities/user.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userRepository: Repository<UserEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  /**
   * Servizio per la creazione nuovo utente
   * @param user User DTO
   * @param role Ruolo da inserire
   * @returns
   */
  async createUser(user: UserDTO, role): Promise<UserEntity> {
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
      console.error('Errore inserimento nuovo utente: ' + error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Ritorna tutti gli utenti
   * @returns Utenti
   */
  async getAllUsers(): Promise<UserDTO> {
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
  }
  /**
   * Ritorna un utente in base all'username, se esiste
   * @param username username dell'utente
   * @returns ritorna oggetto utente
   */
  async getUserByUsername(username: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { username: username },
      relations: {
        role: true,
      },
    });
    if (!user) return null;
    const userDTO = await this.formatUserDTO(user, false);
    return userDTO;
  }
  /**
   * Ritorna utente in base all'id
   * @param id id utente
   * @returns oggetto utente
   */
  async getUserById(id: number): Promise<UserDTO | null> {
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: {
        role: true,
      },
    });
    if (!user) return null;
    const userDTO = await this.formatUserDTO(user, false);
    return userDTO;
  }
  /**
   * Servizio per update utente nel database
   * @param key chiave univoca utente
   * @param updateUser nuovi dati passati dal controller
   */
  async updateUser(key: string, updateUser: any) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(UserEntity).update(
        {
          key: key,
        },
        updateUser,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error('Errore inserimento nuovo utente: ' + error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Elimina utente dal database
   * @param user
   */
  async deleteUser(user: UserEntity) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(UserEntity).remove(user);
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error('Errore eliminazione utente: ' + error);
      await queryRunner.rollbackTransaction();
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
}
