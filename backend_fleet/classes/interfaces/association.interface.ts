import { RoleInterface } from './role.interface';
import { UserInterface } from './user.interface';
import { CommonInterface } from 'classes/common/common.interface';

export interface AssociationInterface extends CommonInterface {
  user: UserInterface;
}
