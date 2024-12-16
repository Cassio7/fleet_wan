import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class VehicleDTO {
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
  @IsNumber()
  profileId: number;
  @IsString()
  profileName: string;
}
