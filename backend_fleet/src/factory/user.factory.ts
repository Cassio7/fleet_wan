import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from 'classes/entities/role.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserFactoryService {
  constructor(
    @InjectRepository(UserEntity, 'mainConnection')
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity, 'mainConnection')
    private roleRepository: Repository<RoleEntity>,
    private configService: ConfigService,
  ) {}

  async createDefaultUser(): Promise<UserEntity[]> {
    const role = await this.roleRepository.find();
    const users = [
      {
        name: 'admin',
        surname: 'admin',
        username: 'admin',
        email: this.configService.get<string>('ADMIN_EMAIL'),
        password: this.configService.get<string>('USER_PASSWORD'),
        active: true,
        role: role[0],
      },
      {
        name: this.configService.get<string>('USER1_NAME'),
        surname: this.configService.get<string>('USER1_SURNMAE'),
        username: this.configService.get<string>('USER1_USERNAME'),
        email: this.configService.get<string>('USER1_EMAIL'),
        password: this.configService.get<string>('USER1_PASSWORD'),
        active: true,
        role: role[1],
      },
      {
        name: 'Luca',
        surname: 'Neri',
        username: 'l.neri',
        email: 'l.neri@nomail.com',
        password: this.configService.get<string>('USER_PASSWORD'),
        active: true,
        role: role[2],
      },
    ];
    const userEntities = users.map((userData) => {
      const user = new UserEntity();
      user.name = userData.name;
      user.surname = userData.surname;
      user.username = userData.username;
      user.email = userData.email;
      user.password = userData.password;
      user.active = userData.active;
      user.role = userData.role;
      return user;
    });

    return this.userRepository.save(userEntities);
  }

  async createDefaultRoles(): Promise<RoleEntity[]> {
    const roles = [
      {
        name: 'Admin',
        description: 'Amministratore della applicazione.',
      },
      { name: 'Responsabile', description: 'Resposabile di una o più società' },
      {
        name: 'Capo Cantiere',
        description: 'Resposabile di uno o più cantieri',
      },
    ];
    const roleEntities = roles.map((roleData) => {
      const role = new RoleEntity();
      role.name = roleData.name;
      role.description = roleData.description;
      return role;
    });
    return this.roleRepository.save(roleEntities);
  }
}
