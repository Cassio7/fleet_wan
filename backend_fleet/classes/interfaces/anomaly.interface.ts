import { CommonInterface } from 'classes/common/common.interface';

export interface AnomalyInterface extends CommonInterface {
  date: Date;
  gps: string;
  antenna: string;
  session: string;
}
