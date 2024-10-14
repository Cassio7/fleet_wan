import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class Device {
  @PrimaryColumn()
  id: number;

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

  @Column({ type: 'timestamp' })
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
  hash: string;
}
