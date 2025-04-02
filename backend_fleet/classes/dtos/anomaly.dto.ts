import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { CommonDTO } from 'classes/dtos/common.dto';

export class AnomalyDTO extends CommonDTO {
  @IsDate()
  date: Date;
  @IsOptional()
  @IsString()
  gps: string | null;
  @IsOptional()
  @IsString()
  antenna: string | null;
  @IsOptional()
  @IsString()
  detection_quality: string | null;
  @IsOptional()
  @IsString()
  session: string | null;
  @IsOptional()
  @IsNumber()
  session_count: number | null;
  @IsOptional()
  @IsNumber()
  gps_count: number | null;
  @IsOptional()
  @IsNumber()
  antenna_count: number | null;
}
