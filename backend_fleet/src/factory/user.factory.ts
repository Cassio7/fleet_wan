import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { RoleEntity } from 'src/classes/entities/role.entity';
import { UserEntity } from 'src/classes/entities/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class UserFactoryService {
  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async createDefaultRoles(): Promise<RoleEntity[]> {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const roles = [
        {
          name: 'Admin',
          description: 'Amministratore della applicazione.',
        },
        {
          name: 'Responsabile',
          description: 'Responsabile di una o più società',
        },
        {
          name: 'Capo Cantiere',
          description: 'Responsabile di uno o più cantieri',
        },
      ];

      const roleEntities = roles.map((roleData) =>
        queryRunner.manager.getRepository(RoleEntity).create({
          name: roleData.name,
          description: roleData.description,
        }),
      );

      const savedRoles = await queryRunner.manager
        .getRepository(RoleEntity)
        .save(roleEntities);
      await queryRunner.commitTransaction();
      return savedRoles;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nella creazione dei ruoli:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createDefaultUser(): Promise<UserEntity[]> {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const roles = await queryRunner.manager.getRepository(RoleEntity).find();

      const users = [
        {
          name: 'admin',
          surname: 'admin',
          username: 'admin',
          email: this.configService.get<string>('ADMIN_EMAIL'),
          password: this.configService.get<string>('USER_PASSWORD'),
          active: true,
          role: roles[0],
        },
        {
          name: this.configService.get<string>('USER1_NAME'),
          surname: this.configService.get<string>('USER1_SURNMAE'),
          username: this.configService.get<string>('USER1_USERNAME'),
          email: this.configService.get<string>('USER1_EMAIL'),
          password: this.configService.get<string>('USER1_PASSWORD'),
          active: true,
          role: roles[1],
        },
      ];

      const userEntities = users.map((userData) =>
        queryRunner.manager.getRepository(UserEntity).create({
          name: userData.name,
          surname: userData.surname,
          username: userData.username,
          email: userData.email,
          password: userData.password,
          active: userData.active,
          role: userData.role,
        }),
      );

      const savedUsers = await queryRunner.manager
        .getRepository(UserEntity)
        .save(userEntities);
      await queryRunner.commitTransaction();
      return savedUsers;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nella creazione degli utenti:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
