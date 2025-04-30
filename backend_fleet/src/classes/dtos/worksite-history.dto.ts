import { IsBoolean, IsDate, IsString } from 'class-validator';
import { CommonDTO } from 'src/classes/dtos/common.dto';
import { WorksiteDTO } from './worksite.dto';

export class WorksiteHistoryDTO extends CommonDTO {
  @IsDate()
  dateFrom: Date;
  @IsDate()
  dateTo: Date | null;
  @IsString()
  comment: string;
  @IsBoolean()
  isActive: boolean;
  worksite: WorksiteDTO | null;
}
