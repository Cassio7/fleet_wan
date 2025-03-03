import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssociationEntity } from 'classes/entities/association.entity';
import { CompanyEntity } from 'classes/entities/company.entity';
import { UserEntity } from 'classes/entities/user.entity';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AssociationFactoryService {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private userRepository: Repository<UserEntity>,
    @InjectRepository(CompanyEntity, 'readOnlyConnection')
    private companyRepository: Repository<CompanyEntity>,
    @InjectRepository(WorksiteEntity, 'readOnlyConnection')
    private worksiteRepository: Repository<WorksiteEntity>,
    @InjectRepository(AssociationEntity, 'mainConnection')
    private associationRepository: Repository<AssociationEntity>,
  ) {}

  async createDefaultAssociation(): Promise<AssociationEntity[]> {
    const admin = await this.userRepository.findOne({
      where: { username: 'admin' },
    });

    if (!admin) throw new Error('User "Admin" not found');

    const companies = await this.companyRepository.find();
    const associations = companies.map((company) => {
      const associationAdmin = new AssociationEntity();
      associationAdmin.user = admin;
      associationAdmin.company = company;
      return associationAdmin;
    });

    // Add new association for user with id 1 to the first company
    const user = await this.userRepository.findOne({
      where: { username: 'm.rossi' },
    });

    if (!user) throw new Error('User "Mario Rossi" not found');

    const associationForFirstCompany = new AssociationEntity();
    associationForFirstCompany.user = user;
    associationForFirstCompany.company = companies[0];
    associations.push(associationForFirstCompany);

    // Existing code for Luca Neri
    const userNeri = await this.userRepository.findOne({
      where: { username: 'l.neri' },
    });
    if (!userNeri) throw new Error('User "Luca Neri" not found');
    // Pallotta
    const worksite = await this.worksiteRepository.findOne({
      where: {
        id: 9,
      },
    });
    const associationUser = new AssociationEntity();
    associationUser.worksite = worksite;
    associationUser.user = userNeri;
    associations.push(associationUser);

    return this.associationRepository.save(associations);
  }
}
