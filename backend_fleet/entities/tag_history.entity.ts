import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity()
export class TagHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column('double precision')
  latitude: number;

  @Column('double precision')
  longitude: number;

  @Column()
  nav_mode: number;

  @Column()
  geozone: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.taghistory)
  @JoinColumn({ name: 'veId' })
  vehicle: Vehicle;
}
