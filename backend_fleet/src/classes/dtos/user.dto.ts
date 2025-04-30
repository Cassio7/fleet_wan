import { Exclude } from 'class-transformer';
import { IsBoolean, IsEmail, IsString, IsOptional } from 'class-validator';
import { CommonDTO } from 'src/classes/dtos/common.dto';

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
  @IsOptional()
  token: string | null;
  @IsOptional()
  clientId: string | null;
}
