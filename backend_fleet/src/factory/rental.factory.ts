import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as path from 'path';
import { RentalEntity } from 'src/classes/entities/rental.entity';
import { parseCsvFile } from 'src/utils/utils';
import { DataSource } from 'typeorm';

@Injectable()
export class RentalFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/NOLEGGIO.csv');

  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  async createDefaultRental(): Promise<RentalEntity[]> {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const rentalData = await parseCsvFile(this.cvsPath);

      const rentalEntities = rentalData.map((data) =>
        queryRunner.manager.getRepository(RentalEntity).create({
          name: data.name,
        }),
      );

      const savedRentals = await queryRunner.manager
        .getRepository(RentalEntity)
        .save(rentalEntities);
      await queryRunner.commitTransaction();
      return savedRentals;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore durante la creazione dei noleggi:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
