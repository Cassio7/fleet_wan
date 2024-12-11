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
   */
  async createUser(user: UserDTO, role): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const newUser = await queryRunner.manager
        .getRepository(UserEntity)
        .create({
          name: user.name,
          surname: user.surname,
          username: user.username,
          email: user.email,
          password: user.password,
          role: role,
        });
      return await queryRunner.manager.getRepository(UserEntity).save(newUser);
    } catch (error) {
      console.error('Errore inserimento nuovo utente: ' + error);
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    } finally {
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }
  }

  /**
   * Ritorna tutti gli utenti
   * @returns Utenti
   */
  async getAllUsers(): Promise<any> {
    const users = await this.userRepository.find({
      relations: {
        role: true,
      },
    });
    return users;
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
    return user;
  }

  /**
   * Ritorna utente in base all'id
   * @param id id utente
   * @returns oggetto utente
   */
  async getUserById(id: number): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: {
        role: true,
      },
    });
    return user;
  }

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
    } catch (error) {
      console.error('Errore inserimento nuovo utente: ' + error);
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    } finally {
      await queryRunner.commitTransaction();
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
    } catch (error) {
      console.error('Errore eliminazione utente: ' + error);
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    } finally {
      await queryRunner.commitTransaction();
      await queryRunner.release();
    }
  }
}
