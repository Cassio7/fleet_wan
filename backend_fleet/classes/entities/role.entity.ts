import { CommonEntity } from 'classes/common/common.entity';
import { RoleInterface } from 'classes/interfaces/role.interface';
import { Column, Entity } from 'typeorm';

@Entity('roles')
export class RoleEntity extends CommonEntity implements RoleInterface {
  @Column()
  name: string;

  @Column()
  description: string;

}
