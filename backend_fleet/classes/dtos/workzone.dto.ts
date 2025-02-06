import { IsOptional, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';
export class WorkzoneDTO extends CommonDTO {
  @IsOptional()
  @IsString()
  name?: string | null;
}
