import { CommonEntity } from 'classes/common/common.entity';
import { RoleInterface } from 'classes/interfaces/role.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('roles')
export class RoleEntity extends CommonEntity implements RoleInterface {
  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  user: UserEntity[];
}
