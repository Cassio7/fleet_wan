import { CommonInterface } from 'src/classes/interfaces/common.interface';

export interface NotificationInterface extends CommonInterface {
  title: string;
  message: string;
  isRead: boolean;
}
