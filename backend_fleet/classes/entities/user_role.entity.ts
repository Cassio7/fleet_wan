import { CommonEntity } from 'classes/common/common.entity';
import { RoleInterface } from 'classes/interfaces/role.interface';
import { UserInterface } from 'classes/interfaces/user.interface';
import { UserRoleInterface } from 'classes/interfaces/user_role.interface';
import { Entity, ManyToOne } from 'typeorm';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';

@Entity('user_roles')
export class UserRoleEntity extends CommonEntity implements UserRoleInterface {
  @ManyToOne(() => UserEntity, (user) => user.user_role)
  user: UserInterface;

  @ManyToOne(() => RoleEntity, (role) => role.user_role)
  role: RoleInterface;
  user_role: Promise<RoleEntity>;
}
