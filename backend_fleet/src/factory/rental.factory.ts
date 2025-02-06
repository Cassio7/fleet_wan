import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RentalEntity } from 'classes/entities/rental.entity';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';
import { Repository } from 'typeorm';

@Injectable()
export class RentalFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/NOLEGGIO.csv');

  constructor(
    @InjectRepository(RentalEntity, 'readOnlyConnection')
    private rentalRepository: Repository<RentalEntity>,
  ) {}
  async createDefaultRental(): Promise<RentalEntity[]> {
    const rentalData = await parseCsvFile(this.cvsPath);
    const rentalEntities = await Promise.all(
      rentalData.map(async (data) => {
        const rental = new RentalEntity();
        rental.name = data.name;

        return rental;
      }),
    );

    return this.rentalRepository.save(rentalEntities);
  }
}
