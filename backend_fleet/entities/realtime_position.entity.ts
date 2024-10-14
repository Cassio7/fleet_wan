import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity()
export class RealtimePosition {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  row_number: number;

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

  @ManyToOne(() => Vehicle)
  veId: Vehicle;
}
