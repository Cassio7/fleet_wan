import { Exclude } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class UserDTO {
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
  password: string;
}
