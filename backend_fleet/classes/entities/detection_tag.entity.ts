import { CommonEntity } from 'classes/common/common.entity';
import { DetectionTagInterface } from 'classes/interfaces/detection_tag.interface';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { TagEntity } from './tag.entity';
import { TagHistoryEntity } from './tag_history.entity';

@Entity({
  name: 'detection_tag',
  comment: `Indica l andamento di una lettura di una tag_history, con dei tag associati`,
})
export class DetectionTagEntity
  extends CommonEntity
  implements DetectionTagInterface
{
  @Column({ nullable: true })
  tid: string;

  @Column('float')
  detection_quality: number;

  @ManyToOne(() => TagEntity, (tag) => tag.detectiontag)
  @Index()
  tag: TagEntity;

  @ManyToOne(() => TagHistoryEntity, (tag_history) => tag_history.detectiontag)
  @Index()
  tagHistory: TagHistoryEntity;
}
