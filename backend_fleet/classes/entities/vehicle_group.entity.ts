import { Entity, JoinColumn, ManyToOne, PrimaryColumn, Index, Column } from 'typeorm';
import { GroupEntity } from './group.entity';
import { VehicleEntity } from './vehicle.entity';
import { VehicleGroupInterface } from 'classes/interfaces/vehiclegroup.interface';
import { CommonEntity } from 'classes/common/common.entity';

@Entity('vehicle_group')
export class VehicleGroupEntity extends CommonEntity implements VehicleGroupInterface{
  @Column()
  vgId: number;

  @Column()
  veId: number;

  @Index()
  @ManyToOne(() => GroupEntity, (group) => group.vgId)
  @JoinColumn({ name: 'vgId' })
  group: GroupEntity;

  @Index()
  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.veId)
  @JoinColumn({ name: 'veId' })
  vehicle: VehicleEntity;
}
