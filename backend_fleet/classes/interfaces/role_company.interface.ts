import { UserRoleInterface } from 'classes/interfaces/user_role.interface';
import { CommonInterface } from 'classes/common/common.interface';
import { CompanyInterface } from './company.interface';

export interface RoleCompanyInterface extends CommonInterface {
  user_role: UserRoleInterface;
  company: CompanyInterface;
}
