import { CommonEntity } from 'classes/common/common.entity';
import { WorksiteHistoryInterface } from 'classes/interfaces/worksite_history.interface';
import { Column, Entity, ManyToOne } from 'typeorm';
import { VehicleEntity } from './vehicle.entity';
import { WorksiteEntity } from './worksite.entity';

@Entity({
  name: 'worksite_history',
  comment: 'Storico cantieri e mezzi',
})
export class WorksiteHistoryEntity
  extends CommonEntity
  implements WorksiteHistoryInterface
{
  @Column({ type: 'timestamptz' })
  dateFrom: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dateTo: Date | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToOne(() => WorksiteEntity, (worksite) => worksite.worksiteHistory, {
    nullable: true,
  })
  worksite: WorksiteEntity | null;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.worksiteHistory, {
    nullable: false,
  })
  vehicle: VehicleEntity;
}
