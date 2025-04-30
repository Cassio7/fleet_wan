import { CommonInterface } from 'src/classes/interfaces/common.interface';
import { VehicleInterface } from './vehicle.interface';
import { WorksiteInterface } from './worksite.interface';

export interface WorksiteHistoryInterface extends CommonInterface {
  dateFrom: Date;
  dateTo: Date | null;
  comment: string | null;
  isActive: boolean;
  worksite: WorksiteInterface | null;
  vehicle: VehicleInterface;
}
