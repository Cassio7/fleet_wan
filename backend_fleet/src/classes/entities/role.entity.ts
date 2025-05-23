import { CommonEntity } from 'src/classes/entities/common.entity';
import { RoleInterface } from 'src/classes/interfaces/role.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({
  name: 'roles',
  comment: `Indicano i ruoli disponibili, con gli utenti associati`,
})
export class RoleEntity extends CommonEntity implements RoleInterface {
  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  user: UserEntity[];
}
