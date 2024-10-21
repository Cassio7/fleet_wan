import { CommonEntity } from 'classes/common/common.entity';
import { HistoryInterface } from 'classes/interfaces/history.interface';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne
} from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { SessionEntity } from './session.entity';

@Entity('history')
export class HistoryEntity extends CommonEntity implements HistoryInterface{

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

  @ManyToOne(() => SessionEntity, (session) => session.history)
  @Index()
  session: SessionEntity;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  hash: string;
}
