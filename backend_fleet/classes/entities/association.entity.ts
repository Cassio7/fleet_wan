import { CommonEntity } from 'classes/common/common.entity';
import { AssociationInterface } from 'classes/interfaces/association.interface';
import { Entity, ManyToOne } from 'typeorm';
import { CompanyEntity } from './company.entity';
import { UserEntity } from './user.entity';
import { WorksiteEntity } from './worksite.entity';

@Entity('associations')
export class AssociationEntity
  extends CommonEntity
  implements AssociationInterface
{
  @ManyToOne(() => UserEntity, (user) => user.association, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: UserEntity;

  @ManyToOne(() => CompanyEntity, (company) => company.association, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  company: CompanyEntity;

  @ManyToOne(() => WorksiteEntity, (worksite) => worksite.association, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  worksite: WorksiteEntity;
}
