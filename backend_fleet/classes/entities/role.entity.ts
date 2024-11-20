import { CommonEntity } from 'classes/common/common.entity';
import { RoleInterface } from 'classes/interfaces/role.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserRoleEntity } from './user_role.entity';
import { RoleCompanyEntity } from './role_company.entity';

@Entity('roles')
export class RoleEntity extends CommonEntity implements RoleInterface {
  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => UserRoleEntity, (user_role) => user_role.role)
  user_role: UserRoleEntity[];

  @OneToMany(() => RoleCompanyEntity, (user_role) => user_role.role)
  role_company: RoleCompanyEntity[];
}
