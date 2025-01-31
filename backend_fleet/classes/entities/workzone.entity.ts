import { CommonEntity } from 'classes/common/common.entity';
import { WorkzoneInterface } from 'classes/interfaces/workzone.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity('workzones')
export class WorkzoneEntity extends CommonEntity implements WorkzoneInterface {
  @Column()
  name: string;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.worksite)
  vehicle: VehicleEntity[];
}
