import { IsNumber, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';
export class CompanyDTO extends CommonDTO {
  @IsNumber()
  suId: number;
  @IsString()
  name: string;
}
