import { CommonEntity } from 'classes/entities/common.entity';
import { AnomalyInterface } from 'classes/interfaces/anomaly.interface';
import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';

@Entity({
  name: 'anomalies',
  comment: 'Salva tutti gli andamenti delle giornate di lavoro di ogni veicolo',
})
export class AnomalyEntity extends CommonEntity implements AnomalyInterface {
  @Column({ type: 'timestamptz' })
  @Index('IDX-anomaly-date')
  date: Date;

  @Column({ type: 'varchar', length: 150, nullable: true })
  gps: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  antenna: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  detection_quality: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  session: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.anomaly)
  @Index('IDX-anomaly-vehicle')
  vehicle: VehicleEntity;

  @Column({ type: 'varchar', length: 100 })
  @Index('IDX-anomaly-hash')
  hash: string;
}
