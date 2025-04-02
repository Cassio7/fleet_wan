import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CommonDTO } from 'classes/dtos/common.dto';

export class VehicleDTO extends CommonDTO {
  @IsNumber()
  @IsOptional()
  veId: number;
  @IsBoolean()
  @IsOptional()
  active: boolean;
  @IsOptional()
  @IsBoolean()
  active_csv: boolean | null;
  @IsString()
  @IsOptional()
  plate: string;
  @IsString()
  @IsOptional()
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
  @IsOptional()
  isCan: boolean;
  @IsOptional()
  @IsString()
  fleet_number: string | null;
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fleet_install: Date | null;
  @IsOptional()
  @IsBoolean()
  electrical: boolean | null;
  @IsBoolean()
  @IsOptional()
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
  @Type(() => Date)
  retired_event?: Date | null;
  @IsOptional()
  @IsNumber()
  worksite_priority: number | null;
  @IsOptional()
  @IsNumber()
  profileId: number;
  @IsOptional()
  @IsString()
  profileName: string;
}
