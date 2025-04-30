import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkzoneEntity } from 'src/classes/entities/workzone.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorkzoneService {
  constructor(
    @InjectRepository(WorkzoneEntity, 'readOnlyConnection')
    private readonly workzoneRepository: Repository<WorkzoneEntity>,
  ) {}

  /**
   * Recupera le zone di lavoro dal database
   * @returns
   */
  async getAllWorkzone(): Promise<WorkzoneEntity[]> {
    try {
      return await this.workzoneRepository.find({
        select: {
          id: true,
          name: true,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante il recupero delle workzone`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
