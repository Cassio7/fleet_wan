import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WorksiteService {
  constructor(
    @InjectRepository(WorksiteEntity, 'readOnlyConnection')
    private readonly worksiteEntity: Repository<WorksiteEntity>,
  ) {}

  /**
   * Ritorna oggetto cantiere in base all id passato
   * @param id identificativo cantiere
   * @returns
   */
  async getWorksiteById(id: number): Promise<any> {
    const worksite = await this.worksiteEntity.findOne({
      where: {
        id: id,
      },
    });
    return worksite;
  }
}
