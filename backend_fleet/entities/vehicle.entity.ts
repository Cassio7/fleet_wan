import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn} from 'typeorm';
import { Device } from './device.entity';

@Entity()
export class Vehicle {
  @PrimaryColumn()
  veId: number;

  @Column({ type: 'boolean' })
  active: boolean;

  @Column({ type: 'varchar', length: 20 })
  plate: string;

  @Column({ type: 'varchar', length: 50 })
  model: string;

  @Column({ type: 'timestamp' })
  firstEvent: Date;

  @Column({ type: 'timestamp' })
  lastEvent: Date;

  @Column({ type: 'timestamp' })
  lastSessionEvent: Date;

  @Column({ type: 'boolean' })
  isCan: boolean;

  @Column({ type: 'boolean' })
  isRFIDReader: boolean;

  @Column()
  profileId: number;

  @Column({ type: 'varchar', length: 50 })
  profileName: string;

  @OneToOne(() => Device)
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column({ type: 'varchar', length: 100 })
  hash: string;
}
