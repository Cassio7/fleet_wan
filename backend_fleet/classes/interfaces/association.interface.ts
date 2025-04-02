import { CommonInterface } from 'classes/interfaces/common.interface';
import { UserInterface } from './user.interface';

export interface AssociationInterface extends CommonInterface {
  user: UserInterface;
}
