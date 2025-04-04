import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { CommonDTO } from 'classes/dtos/common.dto';

export class NotificationDto extends CommonDTO {
  @IsBoolean()
  @IsNotEmpty()
  isRead: boolean;
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsNotEmpty()
  message: string;
}
