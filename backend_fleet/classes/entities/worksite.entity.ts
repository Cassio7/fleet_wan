import { CommonEntity } from 'classes/common/common.entity';
import { WorksiteInterface } from 'classes/interfaces/worksite.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { WorksiteGroupEntity } from './worksite_group.entity';
import { VehicleEntity } from './vehicle.entity';
import { AssociationEntity } from './association.entity';

@Entity('worksites')
export class WorksiteEntity extends CommonEntity implements WorksiteInterface {
  @Column()
  name: string;

  @OneToMany(
    () => WorksiteGroupEntity,
    (worksite_group) => worksite_group.worksite,
  )
  worksite_group: WorksiteGroupEntity[];

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.worksite)
  vehicle: VehicleEntity[];

  @OneToMany(() => AssociationEntity, (association) => association.worksite)
  association: AssociationEntity[];
}
