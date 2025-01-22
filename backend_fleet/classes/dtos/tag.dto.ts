import { IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';

export class TagDTO extends CommonDTO {
  @IsString()
  epc: string;
}
