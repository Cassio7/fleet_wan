import { CommonEntity } from 'classes/common/common.entity';
import { UserRoleInterface } from 'classes/interfaces/user_role.interface';
import { Entity, ManyToOne } from 'typeorm';
import { RoleEntity } from './role.entity';
import { UserEntity } from './user.entity';

@Entity('user_roles')
export class UserRoleEntity extends CommonEntity implements UserRoleInterface {
  @ManyToOne(() => UserEntity, (user) => user.user_role)
  user: UserEntity;

  @ManyToOne(() => RoleEntity, (role) => role.user_role)
  role: RoleEntity;

}
