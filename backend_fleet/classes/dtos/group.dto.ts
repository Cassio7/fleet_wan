import { IsNumber, IsString } from 'class-validator';
import { CommonDTO } from 'classes/dtos/common.dto';
import { CompanyDTO } from './company.dto';

export class GroupDTO extends CommonDTO {
  @IsNumber()
  vgId: number;
  @IsString()
  name: string;
  company: CompanyDTO;
  @IsNumber()
  worksiteCount: number;
}
