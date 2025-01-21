import { IsNumber, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';

export class GroupDTO extends CommonDTO {
  @IsNumber()
  vgId: number;
  @IsString()
  name: string;
}
