import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from 'classes/entities/role.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { UserRoleEntity } from 'classes/entities/userrole.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserFactoryService {
  constructor(
    @InjectRepository(UserEntity, 'mainConnection')
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity, 'mainConnection')
    private roleRepository: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity, 'mainConnection')
    private userRoleRepository: Repository<UserRoleEntity>,
  ) {}

  async createDefaultUser(): Promise<UserEntity> {
    const user = new UserEntity();
    user.username = 'Kevin';
    user.email = 'kevin@nomail.com';
    user.password = 'password';
    return this.userRepository.save(user);
  }

  async createDefaultRole(): Promise<RoleEntity> {
    const role = new RoleEntity();
    role.name = 'Admin';
    role.description = 'Administrator of application, all CRUD operations';
    return this.roleRepository.save(role);
  }

  async createDefaultUserRole(): Promise<UserRoleEntity> {
    const user_role = new UserRoleEntity();
    let user = await this.userRepository.findOne({
      where: { username: 'Kevin' },
    });
    let role = await this.roleRepository.findOne({ where: { name: 'Admin' } });
    user_role.user = user;
    user_role.role = role;

    return this.userRoleRepository.save(user_role);
  }
}
