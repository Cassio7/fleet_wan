import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Exclude } from 'class-transformer';
import { CommonInterface } from './common.interface';

export class CommonDTO implements CommonInterface {
  @IsNumber()
  @IsOptional()
  id: number;
  @IsString()
  @Exclude()
  @IsOptional()
  key: string;
  @IsDate()
  @IsOptional()
  createdAt: Date;
  @IsDate()
  @IsOptional()
  updatedAt: Date;
  @IsNumber()
  @IsOptional()
  version: number;
}
