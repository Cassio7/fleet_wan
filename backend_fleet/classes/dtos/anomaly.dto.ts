import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';

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
}
