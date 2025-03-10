import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { CommonDTO } from 'classes/common/common.dto';

export class NotificationDto extends CommonDTO {
  @IsBoolean()
  @IsNotEmpty()
  isRead: boolean;
  @IsString()
  @IsNotEmpty()
  message: string;
}
