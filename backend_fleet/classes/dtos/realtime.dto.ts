import { IsDate, IsNumber } from 'class-validator';

export class RealtimeDTO {
  @IsDate()
  timestamp: Date;
  @IsNumber()
  status: number;
  @IsNumber()
  latitude: number;
  @IsNumber()
  longitude: number;
  @IsNumber()
  row_number: number;
  @IsNumber()
  nav_mode: number;
  @IsNumber()
  speed: number;
  @IsNumber()
  direction: number;
}
