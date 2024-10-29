import { CommonEntity } from 'classes/common/common.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { DetectionTagEntity } from './detection_tag.entity';

@Entity('tags')
export class TagEntity extends CommonEntity implements TagEntity {
  @Column()
  @Index()
  epc: string;

  @OneToMany(
    () => DetectionTagEntity,
    (detectiontag) => detectiontag.tag,
  )
  detectiontag: DetectionTagEntity[];
}
