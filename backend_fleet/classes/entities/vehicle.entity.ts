import { CommonEntity } from 'classes/common/common.entity';
import { VehicleInterface } from 'classes/interfaces/vehicle.interface';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AnomalyEntity } from './anomaly.entity';
import { DeviceEntity } from './device.entity';
import { HistoryEntity } from './history.entity';
import { NoteEntity } from './note.entity';
import { RealtimePositionEntity } from './realtime_position.entity';
import { ServiceEntity } from './service.entity';
import { TagHistoryEntity } from './tag_history.entity';
import { WorksiteEntity } from './worksite.entity';
import { WorkzoneEntity } from './workzone.entity';
import { RentalEntity } from './rental.entity';
import { EquipmentEntity } from './equipment.entity';

@Entity({
  name: 'vehicles',
  comment: `Tabella che rappresenta tutti i veicoli recuperati dal WSDL`,
})
export class VehicleEntity extends CommonEntity implements VehicleInterface {
  @Column()
  @Index()
  veId: number;

  @Column({ type: 'boolean' })
  active: boolean;

  @Column({ type: 'varchar', length: 20 })
  @Index()
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

  @Column({ type: 'boolean', nullable: true })
  @Index()
  allestimento: boolean;

  @Column()
  profileId: number;

  @Column({ type: 'varchar', length: 50 })
  profileName: string;

  @Column({ type: 'timestamptz', nullable: true })
  retiredEvent: Date;

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

  @OneToMany(() => NoteEntity, (note) => note.vehicle)
  note: NoteEntity[];

  @ManyToOne(() => ServiceEntity, (service) => service.vehicle)
  service: ServiceEntity | null;

  @ManyToOne(() => RentalEntity, (service) => service.vehicle)
  rental: RentalEntity | null;

  @ManyToOne(() => EquipmentEntity, (service) => service.vehicle)
  equipment: EquipmentEntity | null;

  @ManyToOne(() => WorksiteEntity, (worksite) => worksite.vehicle, {
    nullable: true,
  })
  worksite: WorksiteEntity | null;

  @ManyToOne(() => WorkzoneEntity, (workzone) => workzone.vehicle, {
    nullable: true,
  })
  workzone: WorkzoneEntity | null;

  @OneToMany(() => AnomalyEntity, (anomaly) => anomaly.vehicle)
  anomaly: AnomalyEntity[];

  @Column({ type: 'varchar', length: 100 })
  @Index()
  hash: string;
}
