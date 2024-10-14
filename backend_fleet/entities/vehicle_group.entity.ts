import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Group } from './group.entity';
import { Vehicle } from './vehicle.entity';

@Entity()
export class VehicleGroup {
  @PrimaryColumn()
  vg_id: number;

  @PrimaryColumn()
  ve_id: number;

  @Column()
  primary_group: boolean;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'vg_id' })
  group: Group;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 've_id' })
  vehicle: Vehicle;
}
