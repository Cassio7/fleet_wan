import { CommonInterface } from 'classes/common/common.interface';
import { CompanyInterface } from './company.interface';
import { RoleInterface } from './role.interface';

export interface RoleCompanyInterface extends CommonInterface {
  role: RoleInterface;
  company: CompanyInterface;
}
