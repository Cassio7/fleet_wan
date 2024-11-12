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

  async createDefaultRoles(): Promise<RoleEntity[]> {
    const roles = [
      {
        name: 'Admin',
        description: 'Administrator of application, all CRUD operations',
      },
      { name: 'User', description: 'Basic user with only reading access' },
    ];
    const roleEntities = roles.map((roleData) => {
      const role = new RoleEntity();
      role.name = roleData.name;
      role.description = roleData.description;
      return role;
    });
    return this.roleRepository.save(roleEntities);
  }

  async createDefaultUserRoles(): Promise<UserRoleEntity[]> {
    const user = await this.userRepository.findOne({
      where: { username: 'Kevin' },
    });

    if (!user) throw new Error('User "Kevin" not found');

    const roles = await this.roleRepository.find({
      where: [{ name: 'Admin' }, { name: 'User' }],
    });

    const userRoles = roles.map((role) => {
      const userRole = new UserRoleEntity();
      userRole.user = user;
      userRole.role = role;
      return userRole;
    });

    return this.userRoleRepository.save(userRoles);
  }
}
