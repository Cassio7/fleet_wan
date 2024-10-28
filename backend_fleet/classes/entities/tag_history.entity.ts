import { CommonEntity } from 'classes/common/common.entity';
import { TagHistoryInterface } from 'classes/interfaces/tag_history.interface';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { DetectionTagEntity } from './detection_tag.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity('tag_history')
export class TagHistoryEntity
  extends CommonEntity
  implements TagHistoryInterface
{
  @Column()
  id_tag_history: number;

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

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.taghistory)
  @Index()
  vehicle: VehicleEntity;

  @OneToMany(
    () => DetectionTagEntity,
    (detectiontag) => detectiontag.tagHistory,
  )
  detectiontag: DetectionTagEntity[];

  @Column({ type: 'varchar', length: 100 })
  @Index()
  hash: string;
}
