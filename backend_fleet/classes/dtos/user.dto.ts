import { Exclude } from 'class-transformer';
import { IsEmail, IsNumber, IsString, IsDate } from 'class-validator';

export class UserDTO {
  @IsNumber()
  id: number;
  @IsDate()
  createdAt: Date;
  @IsDate()
  updatedAt: Date;
  @IsNumber()
  version: number;
  @IsString()
  name: string;
  @IsString()
  surname: string;
  @IsString()
  username: string;
  @IsEmail()
  email: string;
  @IsString()
  role: string;
  @Exclude()
  @IsString()
  password: string;
}
