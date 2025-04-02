import { CommonInterface } from 'classes/interfaces/common.interface';

export interface AnomalyInterface extends CommonInterface {
  date: Date;
  gps: string;
  antenna: string;
  session: string;
}
