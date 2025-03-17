import { Exclude } from 'class-transformer';
import { IsBoolean, IsEmail, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';

export class UserDTO extends CommonDTO {
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
  @IsBoolean()
  active: boolean;
}
