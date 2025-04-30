import {
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CommonDTO } from 'src/classes/dtos/common.dto';

export class DeviceDTO extends CommonDTO {
  @IsNumber()
  device_id: number;
  @IsNumber()
  type: number;
  @IsString()
  serial_number: string;
  @IsDate()
  date_build: Date;
  @IsBoolean()
  fw_upgrade_disable: boolean;
  @IsNumber()
  fw_id: number;
  @IsOptional()
  @IsDate()
  fw_update?: Date | null;
  @IsNumber()
  fw_upgrade_received: number;
  @IsBoolean()
  rtc_battery_fail: boolean;
  @IsNumber()
  power_fail_detected: number;
  @IsNumber()
  power_on_off_detected: number;
}
