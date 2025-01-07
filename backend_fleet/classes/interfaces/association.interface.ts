import { CommonInterface } from 'classes/common/common.interface';
import { UserInterface } from './user.interface';

export interface AssociationInterface extends CommonInterface {
  user: UserInterface;
}
