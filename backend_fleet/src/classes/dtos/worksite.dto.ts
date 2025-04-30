import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CommonDTO } from 'src/classes/dtos/common.dto';
import { GroupDTO } from './group.dto';
import { VehicleDTO } from './vehicle.dto';
export class WorksiteDTO extends CommonDTO {
  @IsOptional()
  @IsString()
  name: string | null;
  @IsNumber()
  vehicleCount: number;
  group: GroupDTO;
  vehicle: VehicleDTO[];
}
