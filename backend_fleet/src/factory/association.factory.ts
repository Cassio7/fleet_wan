import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { AssociationEntity } from 'src/classes/entities/association.entity';
import { CompanyEntity } from 'src/classes/entities/company.entity';
import { UserEntity } from 'src/classes/entities/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class AssociationFactoryService {
  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  async createDefaultAssociation(): Promise<AssociationEntity[]> {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const admin = await queryRunner.manager
        .getRepository(UserEntity)
        .findOne({
          where: { username: 'admin' },
        });

      if (!admin) throw new Error('User "Admin" not found');
      const companies = await queryRunner.manager
        .getRepository(CompanyEntity)
        .find();

      const associations: AssociationEntity[] = [];

      for (const company of companies) {
        const association = queryRunner.manager
          .getRepository(AssociationEntity)
          .create({
            user: admin,
            company: company,
          });
        associations.push(association);
      }

      // Add new association for user with id 1 to the first company
      const user = await queryRunner.manager.getRepository(UserEntity).findOne({
        where: { id: 2 },
      });

      if (!user) throw new Error('User "Mario Rossi" not found');

      const associationForFirstCompany = queryRunner.manager
        .getRepository(AssociationEntity)
        .create({
          user,
          company: companies[0],
        });
      associations.push(associationForFirstCompany);

      const saved = await queryRunner.manager
        .getRepository(AssociationEntity)
        .save(associations);
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        'Errore durante la creazione delle associazioni per gli utenti default inseriti:',
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
