import { CommonInterface } from 'classes/common/common.interface';

export interface AnomalyInterface extends CommonInterface {
  day: Date;
  gps: string;
  antenna: string;
  session: string;
}
