import { CommonInterface } from 'classes/common/common.interface';
import { DeviceInterface } from './device.interface';
import { HistoryInterface } from './history.interface';
import { RealtimePositionInterface } from './realtime_position.interface';
import { TagHistoryInterface } from './tag_history.interface';

export interface VehicleInterface extends CommonInterface {
  veId: number;
  active: boolean;
  plate: string;
  model: string;
  firstEvent?: Date | null;
  lastEvent?: Date | null;
  lastSessionEvent?: Date | null;
  isCan: boolean;
  isRFIDReader: boolean;
  profileId: number;
  profileName: string;
  device: DeviceInterface;
  //note: string;
  hash: string;
  realtime_position: RealtimePositionInterface[];
  history: HistoryInterface[];
  taghistory: TagHistoryInterface[];
}
