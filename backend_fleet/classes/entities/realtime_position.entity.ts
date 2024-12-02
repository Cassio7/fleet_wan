import { CommonEntity } from 'classes/common/common.entity';
import { RealtimePositionInterface } from 'classes/interfaces/realtime_position.interface';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity('realtime_positions')
export class RealtimePositionEntity
  extends CommonEntity
  implements RealtimePositionInterface
{
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
  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.realtime_position)
  vehicle: VehicleEntity;

  @Column({ type: 'varchar', length: 100 })
  hash: string;
}
