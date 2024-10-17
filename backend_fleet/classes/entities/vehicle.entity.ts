import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DeviceEntity } from './device.entity';
import { RealtimePositionEntity } from './realtime_position.entity';
import { HistoryEntity } from './history.entity';
import { TagHistoryEntity } from './tag_history.entity';
import { CommonEntity } from 'classes/common/common.entity';
import { VehicleInterface } from 'classes/interfaces/vehicle.interface';

@Entity('vehicles')
export class VehicleEntity extends CommonEntity implements VehicleInterface {
  @Column()
  @Index()
  veId: number;

  @Column({ type: 'boolean' })
  active: boolean;

  @Column({ type: 'varchar', length: 20 })
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

  @Column()  // Aggiungi una colonna per l'ID del device
  device_id: number;
  
  @OneToOne(() => DeviceEntity)
  @JoinColumn({ name: 'device_id' })
  @Index()
  device: DeviceEntity;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  hash: string;
  
  @OneToMany(
    () => RealtimePositionEntity,
    (realtime_position) => realtime_position.vehicle,
  )
  realtime_position: RealtimePositionEntity[];

  @OneToMany(() => HistoryEntity, (history) => history.vehicle)
  history: HistoryEntity[];

  @OneToMany(() => TagHistoryEntity, (taghistory) => taghistory.vehicle)
  taghistory: TagHistoryEntity[];
}
