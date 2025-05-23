import { CommonEntity } from 'src/classes/entities/common.entity';
import { RentalInterface } from 'src/classes/interfaces/rental.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity({
  name: 'rental',
  comment: `Indica le aziende adibite al noleggio mezzo`,
})
export class RentalEntity extends CommonEntity implements RentalInterface {
  @Column()
  name: string;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.rental)
  vehicle: VehicleEntity[];
}
