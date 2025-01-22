import { DetectionTagDTO } from './detection_tag.dto';
import { IsDate, IsNumber, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';

export class TagHistoryDTO extends CommonDTO {
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
  detection_tag: DetectionTagDTO[];
}
