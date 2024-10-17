import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { TagHistoryInterface } from 'classes/interfaces/tag_history.interface';
import { DetectionTagEntity } from './detection_tag.entity';

@Entity('tag_history')
export class TagHistoryEntity implements TagHistoryInterface {
  @PrimaryGeneratedColumn()
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
  @JoinColumn({ name: 'veId' })
  @Index()
  vehicle: VehicleEntity;

  @OneToMany(
    () => DetectionTagEntity,
    (detectiontag) => detectiontag.tagHistory,
  )
  @JoinColumn({ name: 'id' })
  detectiontag: DetectionTagEntity[];
}
