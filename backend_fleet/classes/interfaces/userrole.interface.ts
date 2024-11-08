import { RoleInterface } from './role.interface';
import { UserInterface } from './user.interface';
import { CommonInterface } from 'classes/common/common.interface';

export interface UserRoleInterface extends CommonInterface {
  user: UserInterface;
  role: RoleInterface;
}
