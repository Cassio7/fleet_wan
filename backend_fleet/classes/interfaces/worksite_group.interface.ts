import { CommonInterface } from 'classes/common/common.interface';
import { GroupInterface } from './group.interface';
import { WorksiteInterface } from './worksite.interface';

export interface WorksiteGroupInterface extends CommonInterface {
  group: GroupInterface;
  worksite: WorksiteInterface;
}
