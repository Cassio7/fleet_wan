import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity()
export class RealtimePosition {
  @PrimaryGeneratedColumn()
  id: number;

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

  @ManyToOne(() => Vehicle)
  veId: Vehicle;
  
  @Column({ type: 'varchar', length: 100 })
  hash: string;
}
