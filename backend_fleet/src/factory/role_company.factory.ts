import { CompanyService } from 'src/services/company/company.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from 'classes/entities/role.entity';
import { RoleCompanyEntity } from 'classes/entities/role_company.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleCompanyFactoryService {
  constructor(
    @InjectRepository(RoleCompanyEntity, 'mainConnection')
    private roleCompanyRepository: Repository<RoleCompanyEntity>,
    @InjectRepository(RoleEntity, 'readOnlyConnection')
    private roleRepository: Repository<RoleEntity>,
    private readonly companyService: CompanyService,
  ) {}
  async createDefaultRoleCompany(): Promise<RoleCompanyEntity[]> {
    const role = await this.roleRepository.findOne({
      where: [{ name: 'Admin' }],
    });

    const companies = await this.companyService.getAllCompany();
    const roleCompanies = companies.map((company) => {
      const roleCompany = new RoleCompanyEntity();
      roleCompany.role = role;
      roleCompany.company = company;
      return roleCompany;
    });
    return this.roleCompanyRepository.save(roleCompanies);
  }
}
