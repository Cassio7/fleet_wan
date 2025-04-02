import { CommonInterface } from 'classes/interfaces/common.interface';

export interface NotificationInterface extends CommonInterface {
  message: string;
  isRead: boolean;
}
