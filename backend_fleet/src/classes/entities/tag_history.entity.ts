import { CommonEntity } from 'src/classes/entities/common.entity';
import { TagHistoryInterface } from 'src/classes/interfaces/tag_history.interface';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { DetectionTagEntity } from './detection_tag.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity({
  name: 'tag_history',
  comment: `Indica la posizione (ed altri dati) della lettura di un tag`,
})
export class TagHistoryEntity
  extends CommonEntity
  implements TagHistoryInterface
{
  @Column({ type: 'timestamptz', nullable: true })
  @Index('IDX-taghistory-timestamp')
  timestamp: Date;

  @Column('double precision')
  latitude: number;

  @Column('double precision')
  longitude: number;

  @Column()
  nav_mode: number;

  @Column({ nullable: true })
  geozone: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.taghistory)
  @Index('IDX-taghistory-vehicle')
  vehicle: VehicleEntity;

  @OneToMany(
    () => DetectionTagEntity,
    (detectiontag) => detectiontag.tagHistory,
  )
  detectiontag: DetectionTagEntity[];

  @Column({ type: 'varchar', length: 100 })
  @Index('IDX-taghistory-hash')
  hash: string;
}
