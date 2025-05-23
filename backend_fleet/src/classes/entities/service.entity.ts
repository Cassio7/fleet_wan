import { CommonEntity } from 'src/classes/entities/common.entity';
import { ServiceInterface } from 'src/classes/interfaces/service.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity({
  name: 'services',
  comment: `Indica le attività possibili che ogni mezzo può svolgere`,
})
export class ServiceEntity extends CommonEntity implements ServiceInterface {
  @Column()
  name: string;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.service)
  vehicle: VehicleEntity[];
}
