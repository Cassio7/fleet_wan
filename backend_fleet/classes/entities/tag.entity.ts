import { Entity, PrimaryColumn, OneToMany, JoinColumn, Index } from 'typeorm';
import { DetectionTagEntity } from './detection_tag.entity';

@Entity('tags')
export class TagEntity {
  @PrimaryColumn()
  @Index()
  epc: string;

  @OneToMany(
    () => DetectionTagEntity,
    (detectiontag) => detectiontag.tagHistory,
  )
  @JoinColumn({ name: 'id' })
  detectiontag: DetectionTagEntity[];
}
