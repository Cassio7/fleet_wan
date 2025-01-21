import { IsDate, IsNumber } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';

export class HistoryDTO extends CommonDTO {
  @IsDate()
  timestamp: Date;
  @IsNumber()
  status: number;
  @IsNumber()
  latitude: number;
  @IsNumber()
  longitude: number;
  @IsNumber()
  nav_mode: number;
  @IsNumber()
  speed: number;
  @IsNumber()
  direction: number;
  @IsNumber()
  tot_distance: number;
  @IsNumber()
  tot_consumption: number;
  @IsNumber()
  fuel: number;
  @IsNumber()
  brushes: number;
}
