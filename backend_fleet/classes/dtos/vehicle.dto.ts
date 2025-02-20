import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';
import { WorksiteDTO } from './worksite.dto';

export class VehicleDTO extends CommonDTO {
  @IsNumber()
  veId: number;
  @IsBoolean()
  active: boolean;
  @IsOptional()
  @IsBoolean()
  active_csv: boolean | null;
  @IsString()
  plate: string;
  @IsString()
  model: string;
  @IsOptional()
  @IsString()
  model_csv: string | null;
  @IsOptional()
  @IsString()
  registration: string | null;
  @IsOptional()
  @IsString()
  euro: string | null;
  @IsOptional()
  @IsDate()
  firstEvent?: Date | null;
  @IsOptional()
  @IsDate()
  lastEvent?: Date | null;
  @IsOptional()
  @IsDate()
  lastSessionEvent?: Date | null;
  @IsBoolean()
  isCan: boolean;
  @IsOptional()
  @IsString()
  fleet_number: string | null;
  @IsOptional()
  @IsString()
  fleet_install: string | null;
  @IsOptional()
  @IsBoolean()
  electrical: boolean | null;
  @IsBoolean()
  isRFIDReader: boolean;
  @IsOptional()
  @IsBoolean()
  allestimento: boolean | null;
  @IsOptional()
  @IsString()
  antenna_setting: string | null;
  @IsOptional()
  @IsString()
  fleet_antenna_number: string | null;
  @IsOptional()
  @IsDate()
  retired_event?: Date | null;
  @IsOptional()
  @IsNumber()
  worksite_priority: number | null;
  @IsOptional()
  worksite: WorksiteDTO;
  @IsNumber()
  profileId: number;
  @IsString()
  profileName: string;
}
