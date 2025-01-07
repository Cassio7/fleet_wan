import { IsBoolean, IsDate, IsNumber } from 'class-validator';

export class SessionDTO {
  @IsNumber()
  id: number;
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
}
