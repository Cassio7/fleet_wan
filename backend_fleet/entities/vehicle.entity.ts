import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, OneToMany } from 'typeorm';
import { Device } from './device.entity';
import { RealtimePosition } from './realtime_position.entity';

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

  @Column({ type: 'timestamptz', nullable: true })
  firstEvent: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastEvent: Date;

  @Column({ type: 'timestamptz', nullable: true })
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

  @OneToMany(() => RealtimePosition, (realtime_position) => realtime_position.vehicle)
  realtime_position: RealtimePosition[]
}
