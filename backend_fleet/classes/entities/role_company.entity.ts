import { CommonEntity } from 'classes/common/common.entity';
import { RoleCompanyInterface } from 'classes/interfaces/role_company.interface';
import { Entity, ManyToOne } from 'typeorm';
import { CompanyEntity } from './company.entity';
import { RoleEntity } from './role.entity';

@Entity('role_company')
export class RoleCompanyEntity
  extends CommonEntity
  implements RoleCompanyInterface
{
  @ManyToOne(() => RoleEntity, (user_role) => user_role.role_company)
  role: RoleEntity;

  @ManyToOne(() => CompanyEntity, (company) => company.role_company)
  company: CompanyEntity;
}
