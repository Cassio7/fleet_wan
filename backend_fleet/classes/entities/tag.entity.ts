import { CommonEntity } from 'classes/common/common.entity';
import { Column, Entity, Index, OneToMany } from 'typeorm';
import { DetectionTagEntity } from './detection_tag.entity';
import { TagInterface } from 'classes/interfaces/tag.interface';

@Entity({
  name: 'tags',
  comment: `Indica un tag, solitamente associato ad un cassonetto`,
})
export class TagEntity extends CommonEntity implements TagInterface {
  @Column()
  @Index()
  epc: string;

  @OneToMany(() => DetectionTagEntity, (detectiontag) => detectiontag.tag)
  detectiontag: DetectionTagEntity[];
}
