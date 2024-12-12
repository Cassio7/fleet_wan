import { CommonEntity } from 'classes/common/common.entity';
import { AnomalyInterface } from 'classes/interfaces/anomaly.interface';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity('anomalies')
export class AnomalyEntity extends CommonEntity implements AnomalyInterface {
  @Column({ type: 'timestamptz' })
  @Index()
  date: Date;

  @Column({ type: 'varchar', length: 150, nullable: true })
  gps: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  antenna: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  session: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.anomaly)
  @Index()
  vehicle: VehicleEntity;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  hash: string;
}
