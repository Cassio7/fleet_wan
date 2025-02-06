import { CommonEntity } from 'classes/common/common.entity';
import { GroupInterface } from 'classes/interfaces/group.interface';
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { CompanyEntity } from './company.entity';
import { WorksiteGroupEntity } from './worksite_group.entity';

@Entity({
  name: 'groups',
  comment: `Comuni`,
})
export class GroupEntity extends CommonEntity implements GroupInterface {
  @Column()
  @Index()
  vgId: number;

  @Column()
  name: string;

  @ManyToOne(() => CompanyEntity, (company) => company.group)
  company: CompanyEntity;

  @OneToMany(
    () => WorksiteGroupEntity,
    (worksite_group) => worksite_group.group,
  )
  worksite_group: WorksiteGroupEntity[];
}
