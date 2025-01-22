import { IsNumber, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';
import { TagDTO } from './tag.dto';

export class DetectionTagDTO extends CommonDTO {
  @IsString()
  tid: string;
  @IsNumber()
  detection_quality: number;
  tag: TagDTO;
}
