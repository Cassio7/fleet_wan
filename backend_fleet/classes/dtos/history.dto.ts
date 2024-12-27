import { IsDate, IsNumber } from 'class-validator';

export class HistoryDTO {
  @IsNumber()
  id: number;
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
