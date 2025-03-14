import { IsBoolean, IsDate, IsNumber } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';

export class RealtimeDTO extends CommonDTO {
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
  @IsBoolean()
  active: boolean;
}
