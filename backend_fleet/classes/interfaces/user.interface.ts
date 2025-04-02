import { CommonInterface } from 'classes/interfaces/common.interface';

export interface UserInterface extends CommonInterface {
  username: string;
  email: string;
  name: string;
  surname: string;
  password: string;
  active: boolean;
}
