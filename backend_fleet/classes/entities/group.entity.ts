import { CommonEntity } from 'classes/common/common.entity';
import { GroupInterface } from 'classes/interfaces/group.interface';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { VehicleGroupEntity } from './vehicle_group.entity';

@Entity('groups')
export class GroupEntity extends CommonEntity implements GroupInterface {
  @Column()
  @Index()
  vgId: number;

  @Column()
  name: string;
  
  @OneToMany(() => VehicleGroupEntity, (vehicle_group) => vehicle_group.group)
  vehicle_group: VehicleGroupEntity[];
}
