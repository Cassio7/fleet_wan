import { IsOptional, IsString } from 'class-validator';
import { CommonDTO } from 'classes/dtos/common.dto';
export class EquipmentDTO extends CommonDTO {
  @IsOptional()
  @IsString()
  name?: string | null;
}
