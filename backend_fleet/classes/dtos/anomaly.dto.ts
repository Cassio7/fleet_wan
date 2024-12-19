import { IsDate, IsOptional, IsString } from 'class-validator';

export class AnomalyDTO {
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
