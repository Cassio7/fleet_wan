import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';
import { GroupDTO } from './group.dto';
export class WorksiteDTO extends CommonDTO {
  @IsOptional()
  @IsString()
  name: string | null;
  @IsNumber()
  vehicleCount: number;
  group: GroupDTO;
}
