import { CommonEntity } from 'classes/common/common.entity';
import { WorksiteGroupInterface } from 'classes/interfaces/worksite_group.interface';
import { Entity, ManyToOne } from 'typeorm';
import { GroupEntity } from './group.entity';
import { WorksiteEntity } from './worksite.entity';

@Entity('worksite_group')
export class WorksiteGroupEntity
  extends CommonEntity
  implements WorksiteGroupInterface
{
  @ManyToOne(() => GroupEntity, (group) => group.worksite_group)
  group: GroupEntity;

  @ManyToOne(() => WorksiteEntity, (worksite) => worksite.worksite_group)
  worksite: WorksiteEntity;

}
