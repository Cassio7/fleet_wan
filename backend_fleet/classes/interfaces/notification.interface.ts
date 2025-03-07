import { CommonInterface } from 'classes/common/common.interface';

export interface NotificationInterface extends CommonInterface {
  message: string;
  isRead: boolean;
}
