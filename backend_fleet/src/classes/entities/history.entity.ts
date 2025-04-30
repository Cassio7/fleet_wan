import { CommonEntity } from 'src/classes/entities/common.entity';
import { HistoryInterface } from 'src/classes/interfaces/history.interface';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { SessionEntity } from './session.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity({
  name: 'history',
  comment: `Indica una posizione GPS associata ad una sessione`,
})
export class HistoryEntity extends CommonEntity implements HistoryInterface {
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
  @Index('IDX-history-vehicle')
  vehicle: VehicleEntity;

  @ManyToOne(() => SessionEntity, (session) => session.history, {
    onDelete: 'CASCADE',
  })
  @Index('IDX-history-session')
  session: SessionEntity;

  @Column({ type: 'varchar', length: 100 })
  @Index('IDX-history-hash')
  hash: string;
}
