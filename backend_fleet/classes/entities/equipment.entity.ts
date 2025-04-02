import { CommonEntity } from 'classes/entities/common.entity';
import { EquipmentInterface } from './../interfaces/equipment.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity({
  name: 'equipments',
  comment: `Indica le tipologie di attrezzature installate`,
})
export class EquipmentEntity
  extends CommonEntity
  implements EquipmentInterface
{
  @Column()
  name: string;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.equipment)
  vehicle: VehicleEntity[];
}
