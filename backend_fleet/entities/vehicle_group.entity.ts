import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Group } from './group.entity';
import { Vehicle } from './vehicle.entity';


@Entity()
export class VehicleGroup {
  @PrimaryColumn()
  vgId: number;

  @PrimaryColumn()
  veId: number;

  @ManyToOne(() => Group, (group) => group.vgId)
  @JoinColumn({ name: 'vgId' })
  group: Group;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.veId)
  @JoinColumn({ name: 'veId' })
  vehicle: Vehicle;
}
