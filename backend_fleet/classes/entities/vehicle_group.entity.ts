import { CommonEntity } from 'classes/common/common.entity';
import { VehicleGroupInterface } from 'classes/interfaces/vehiclegroup.interface';
import {
  Entity,
  Index,
  ManyToOne
} from 'typeorm';
import { GroupEntity } from './group.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity('vehicle_group')
export class VehicleGroupEntity
  extends CommonEntity
  implements VehicleGroupInterface
{
  @Index()
  @ManyToOne(() => GroupEntity, (group) => group.vehicle_group)
  group: GroupEntity;

  @Index()
  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.vehicle_group)
  vehicle: VehicleEntity;
}
