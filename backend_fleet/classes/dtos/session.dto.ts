import { IsBoolean, IsDate, IsNumber } from 'class-validator';
import { CommonDTO } from 'classes/dtos/common.dto';
import { HistoryDTO } from './history.dto';

export class SessionDTO extends CommonDTO {
  @IsDate()
  period_from: Date;
  @IsDate()
  period_to: Date;
  @IsNumber()
  sequence_id: number;
  @IsBoolean()
  closed: boolean;
  @IsNumber()
  distance: number;
  @IsNumber()
  engine_drive: number;
  @IsNumber()
  engine_stop: number;
  history: HistoryDTO[] | HistoryDTO;
}
