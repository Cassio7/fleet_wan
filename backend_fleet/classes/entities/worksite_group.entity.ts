import { CommonEntity } from 'classes/common/common.entity';
import { WorksiteGroupInterface } from 'classes/interfaces/worksite_group.interface';
import { Entity, ManyToOne } from 'typeorm';
import { GroupEntity } from './group.entity';
import { WorksiteEntity } from './worksite.entity';

@Entity({
  name: 'worksite_group',
  comment: `Tabella che associa ogni cantiere al suo comune, con l aggiunta dei comuni predefiniti`,
})
export class WorksiteGroupEntity
  extends CommonEntity
  implements WorksiteGroupInterface
{
  @ManyToOne(() => GroupEntity, (group) => group.worksite_group)
  group: GroupEntity;

  @ManyToOne(() => WorksiteEntity, (worksite) => worksite.worksite_group)
  worksite: WorksiteEntity;
}
