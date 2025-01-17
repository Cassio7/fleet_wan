import { IsNumber, IsOptional, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';
export class CompanyDTO extends CommonDTO {
  @IsNumber()
  suId: number;
  @IsOptional()
  @IsString()
  name?: string | null;
}
