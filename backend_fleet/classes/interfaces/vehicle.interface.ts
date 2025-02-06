import { CommonInterface } from 'classes/common/common.interface';
import { DeviceInterface } from './device.interface';
import { HistoryInterface } from './history.interface';
import { RealtimePositionInterface } from './realtime_position.interface';
import { TagHistoryInterface } from './tag_history.interface';

export interface VehicleInterface extends CommonInterface {
  veId: number;
  active: boolean;
  active_csv: boolean | null;
  plate: string;
  model: string;
  model_csv: string | null;
  registration: string | null;
  euro: string | null;
  firstEvent: Date | null;
  lastEvent: Date | null;
  lastSessionEvent: Date | null;
  isCan: boolean;
  fleet_number: string | null;
  fleet_install: string | null;
  electrical: boolean | null;
  isRFIDReader: boolean;
  allestimento: boolean | null;
  antenna_setting: string | null;
  fleet_antenna_number: string | null;
  profileId: number;
  profileName: string;
  retired_event: Date | null;
  worksite_priority: number | null;
  device: DeviceInterface;
  hash: string;
  realtime_position: RealtimePositionInterface[];
  history: HistoryInterface[];
  taghistory: TagHistoryInterface[];
}
