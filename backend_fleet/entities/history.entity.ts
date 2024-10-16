import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity()
export class History {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date_from: Date;

  @Column({ type: 'date' })
  date_to: Date;

  @Column({ type: 'timestamp' })
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

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.history)
  @JoinColumn({ name: 'veId' })
  vehicle: Vehicle;
}
