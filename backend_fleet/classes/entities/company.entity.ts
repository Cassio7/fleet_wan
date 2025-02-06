import { CommonEntity } from 'classes/common/common.entity';
import { CompanyInterface } from 'classes/interfaces/company.interface';
import { Column, Entity, OneToMany } from 'typeorm';
import { GroupEntity } from './group.entity';
import { AssociationEntity } from './association.entity';

@Entity({
  name: 'companies',
  comment: 'Società',
})
export class CompanyEntity extends CommonEntity implements CompanyInterface {
  @Column()
  suId: number;

  @Column()
  name: string;

  @OneToMany(() => GroupEntity, (group) => group.company)
  group: GroupEntity[];

  @OneToMany(() => AssociationEntity, (association) => association.company)
  association: AssociationEntity[];
}
