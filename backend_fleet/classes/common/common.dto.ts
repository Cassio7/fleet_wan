import { IsDate, IsNumber, IsString } from 'class-validator';
import { Exclude } from 'class-transformer';
import { CommonInterface } from './common.interface';

export class CommonDTO implements CommonInterface {
  @IsNumber()
  id: number;
  @IsString()
  @Exclude()
  key: string;
  @IsDate()
  createdAt: Date;
  @IsDate()
  updatedAt: Date;
  @IsNumber()
  version: number;
}
