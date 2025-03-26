import { CommonEntity } from 'classes/common/common.entity';
import { WorksiteInterface } from 'classes/interfaces/worksite.interface';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { AssociationEntity } from './association.entity';
import { GroupEntity } from './group.entity';
import { VehicleEntity } from './vehicle.entity';

@Entity({
  name: 'worksites',
  comment: `Cantieri`,
})
export class WorksiteEntity extends CommonEntity implements WorksiteInterface {
  @Column()
  name: string;

  @ManyToOne(() => GroupEntity, (group) => group.worksite)
  group: GroupEntity;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.worksite)
  vehicle: VehicleEntity[];

  @OneToMany(() => AssociationEntity, (association) => association.worksite, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  association: AssociationEntity[];
}
