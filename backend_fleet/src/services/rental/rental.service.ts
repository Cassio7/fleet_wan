import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RentalDTO } from 'classes/dtos/rental.dto';
import { RentalEntity } from 'classes/entities/rental.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RentalService {
  constructor(
    @InjectRepository(RentalEntity, 'readOnlyConnection')
    private readonly rentalRepository: Repository<RentalEntity>,
  ) {}

  async getRentals(): Promise<RentalDTO[]> {
    const rentals = await this.rentalRepository.find();
    return rentals.map((rental) => this.toDTO(rental));
  }

  private toDTO(rental: RentalEntity): RentalDTO {
    const rentalDTO = new RentalDTO();
    rentalDTO.id = rental.id;
    rentalDTO.createdAt = rental.createdAt;
    rentalDTO.updatedAt = rental.updatedAt;
    rentalDTO.name = rental.name;
    return rentalDTO;
  }
}
