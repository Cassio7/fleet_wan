import { CommonInterface } from 'classes/common/common.interface';
import { SessionInterface } from './session.interface';
import { VehicleInterface } from './vehicle.interface';

export interface HistoryInterface extends CommonInterface{
  timestamp?: Date | null;
  status: number;
  latitude: number;
  longitude: number;
  nav_mode: number;
  speed: number;
  direction: number;
  tot_distance: number;
  tot_consumption: number;
  fuel: number;
  brushes: number;
  vehicle: VehicleInterface;
  session: SessionInterface;
  hash: string;
}
