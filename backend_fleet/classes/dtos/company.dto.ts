import { IsNumber, IsOptional, IsString } from 'class-validator';
export class CompanyDTO {
  @IsNumber()
  id: number;
  @IsNumber()
  suId: number;
  @IsOptional()
  @IsString()
  name?: string | null;
}
