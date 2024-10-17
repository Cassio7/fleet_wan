import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { HistoryInterface } from 'classes/interfaces/history.interface';

@Entity('history')
export class HistoryEntity implements HistoryInterface{
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column()
  speed: number;

  @Column()
  direction: number;

  @Column('double precision')
  tot_distance: number;

  @Column('double precision')
  tot_consumption: number;

  @Column('float')
  fuel: number;

  @Column()
  brushes: number;
  
  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.history)
  @JoinColumn({ name: 'veId' })
  @Index()
  vehicle: VehicleEntity;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  hash: string;
}
