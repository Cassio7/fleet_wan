import { IsDate, IsNumber, IsString } from 'class-validator';
import { CommonDTO } from 'src/classes/dtos/common.dto';

export class TagDTO extends CommonDTO {
  @IsString()
  epc: string;
  @IsString()
  tid: string;
  @IsNumber()
  detection_quality: number;
  @IsDate()
  timestamp: Date;
  @IsNumber()
  latitude: number;
  @IsNumber()
  longitude: number;
  @IsNumber()
  nav_mode: number;
  @IsString()
  geozone: string;
  @IsString()
  plate: string;
  @IsString()
  worksite: string;
}
