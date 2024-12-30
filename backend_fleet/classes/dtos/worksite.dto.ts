import { IsNumber, IsOptional, IsString } from 'class-validator';
export class WorksiteDTO {
  @IsNumber()
  id: number;
  @IsOptional()
  @IsString()
  name?: string | null;
}
