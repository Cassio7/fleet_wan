import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { RealtimePositionInterface } from 'classes/interfaces/realtime_position.interface';

@Entity('realtime_positions')
export class RealtimePositionEntity implements RealtimePositionInterface {
  @Index()
  @PrimaryGeneratedColumn()
  id_realtime: number;

  @Column()
  row_number: number;

  @Column({ type: 'timestamptz', nullable: true })
  timestamp: Date;

  @Column()
  status: number;

  @Column('double precision')
  latitude: number;

  @Column('double precision')
  longitude: number;

  @Column()
  nav_mode: number;

  @Column('float')
  speed: number;

  @Column('float')
  direction: number;

  @Index()
  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.veId)
  vehicle: VehicleEntity;

  @Column({ type: 'varchar', length: 100 })
  hash: string;
}
