import { CommonEntity } from 'classes/common/common.entity';
import { VehicleInterface } from 'classes/interfaces/vehicle.interface';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { DeviceEntity } from './device.entity';
import { HistoryEntity } from './history.entity';
import { RealtimePositionEntity } from './realtime_position.entity';
import { TagHistoryEntity } from './tag_history.entity';
import { VehicleGroupEntity } from './vehicle_group.entity';

@Entity('vehicles')
export class VehicleEntity extends CommonEntity implements VehicleInterface {
  @Column()
  @Index()
  veId: number;

  @Column({ type: 'boolean' })
  active: boolean;

  @Column({ type: 'varchar', length: 20 })
  //@Index()
  plate: string;

  @Column({ type: 'varchar', length: 50 })
  model: string;

  @Column({ type: 'timestamptz', nullable: true })
  firstEvent: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastEvent: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSessionEvent: Date;

  @Column({ type: 'boolean' })
  isCan: boolean;

  @Column({ type: 'boolean' })
  @Index()
  isRFIDReader: boolean;

  @Column()
  profileId: number;

  @Column({ type: 'varchar', length: 50 })
  profileName: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  hash: string;

  // @Column({ type: 'varchar', nullable: true })
  // note: string;

  @OneToOne(() => DeviceEntity)
  @JoinColumn({ name: 'device_id' })
  @Index()
  device: DeviceEntity;

  @OneToMany(
    () => RealtimePositionEntity,
    (realtime_position) => realtime_position.vehicle,
  )
  realtime_position: RealtimePositionEntity[];

  @OneToMany(() => HistoryEntity, (history) => history.vehicle)
  history: HistoryEntity[];

  @OneToMany(() => TagHistoryEntity, (taghistory) => taghistory.vehicle)
  taghistory: TagHistoryEntity[];

  @OneToMany(() => VehicleGroupEntity, (vehicle_group) => vehicle_group.vehicle)
  vehicle_group: VehicleGroupEntity[];
}
