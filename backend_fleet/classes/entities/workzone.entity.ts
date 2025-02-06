import { CommonEntity } from 'classes/common/common.entity';
import { WorkzoneInterface } from 'classes/interfaces/workzone.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity({
  name: 'workzones',
  comment: `Indica la zona di lavoro di un mezzo`,
})
export class WorkzoneEntity extends CommonEntity implements WorkzoneInterface {
  @Column()
  name: string;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.worksite)
  vehicle: VehicleEntity[];
}
