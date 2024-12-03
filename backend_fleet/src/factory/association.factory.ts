import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssociationEntity } from 'classes/entities/association.entity';
import { CompanyEntity } from 'classes/entities/company.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AssociationFactoryService {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private userRepository: Repository<UserEntity>,
    @InjectRepository(CompanyEntity, 'readOnlyConnection')
    private companyRepository: Repository<CompanyEntity>,
    @InjectRepository(AssociationEntity, 'mainConnection')
    private associationRepository: Repository<AssociationEntity>,
  ) {}

  async createDefaultAssociation(): Promise<AssociationEntity[]> {
    const user = await this.userRepository.findOne({
      where: { username: 'Admin' },
    });

    if (!user) throw new Error('User "Admin" not found');

    const companies = await this.companyRepository.find();
    const associations = companies.map((company) => {
      const associationUser = new AssociationEntity();
      associationUser.user = user;
      associationUser.company = company;
      return associationUser;
    });

    return this.associationRepository.save(associations);
  }
}
