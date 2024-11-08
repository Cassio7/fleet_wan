export class Device {
  constructor(
    public device_id: number,
    public type: number,
    public serial_number: string,
    public date_build: Date,
    public fw_upgrade_disable: boolean,
    public fw_id: number,
    public fw_update: Date | null = null,
    public fw_upgrade_received: number,
    public rtc_battery_fail: boolean,
    public power_fail_detected: number,
    public power_on_off_detected: number,
    public hash: string
  ) {}
}
