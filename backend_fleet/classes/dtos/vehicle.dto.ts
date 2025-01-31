import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';

export class VehicleDTO extends CommonDTO {
  @IsNumber()
  veId: number;
  @IsBoolean()
  active: boolean;
  @IsString()
  plate: string;
  @IsString()
  model: string;
  @IsOptional()
  @IsDate()
  firstEvent?: Date | null;
  @IsOptional()
  @IsDate()
  lastEvent?: Date | null;
  @IsOptional()
  @IsDate()
  lastSessionEvent?: Date | null;
  @IsOptional()
  @IsDate()
  retiredEvent?: Date | null;
  @IsBoolean()
  isCan: boolean;
  @IsBoolean()
  isRFIDReader: boolean;
  @IsOptional()
  @IsBoolean()
  allestimento?: boolean | null;
  @IsOptional()
  @IsString()
  relevant_company?: string | null;
  @IsNumber()
  profileId: number;
  @IsString()
  profileName: string;
}
