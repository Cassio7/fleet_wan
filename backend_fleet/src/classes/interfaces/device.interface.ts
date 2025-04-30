import { CommonInterface } from "src/classes/interfaces/common.interface";

export interface DeviceInterface extends CommonInterface{
  device_id: number;
  type: number;
  serial_number: string;
  date_build: Date;
  fw_upgrade_disable: boolean;
  fw_id: number;
  fw_update?: Date | null;
  fw_upgrade_received: number;
  rtc_battery_fail: boolean;
  power_fail_detected: number;
  power_on_off_detected: number;
  hash: string;
}
