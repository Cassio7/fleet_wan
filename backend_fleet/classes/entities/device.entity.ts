import { CommonEntity } from 'classes/common/common.entity';
import { DeviceInterface } from 'classes/interfaces/device.interface';
import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

@Entity('devices')
export class DeviceEntity extends CommonEntity implements DeviceInterface {
  @Column()
  device_id: number;

  @Column()
  type: number;

  @Column()
  serial_number: string;

  @Column({ type: 'date' })
  date_build: Date;

  @Column()
  fw_upgrade_disable: boolean;

  @Column()
  fw_id: number;

  @Column({ type: 'timestamptz', nullable: true })
  fw_update: Date;

  @Column()
  fw_upgrade_received: number;

  @Column()
  rtc_battery_fail: boolean;

  @Column()
  power_fail_detected: number;

  @Column()
  power_on_off_detected: number;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  hash: string;
}
