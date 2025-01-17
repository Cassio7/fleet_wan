import { IsDate, IsOptional, IsString } from 'class-validator';
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
  session: string | null;
}
