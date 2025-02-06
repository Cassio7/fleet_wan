import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkzoneEntity } from 'classes/entities/workzone.entity';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';
import { Repository } from 'typeorm';

@Injectable()
export class WorkzoneFacotoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/ZONA.csv');
  constructor(
    @InjectRepository(WorkzoneEntity, 'readOnlyConnection')
    private workzoneRepository: Repository<WorkzoneEntity>,
  ) {}
  async createDefaultWorkzone(): Promise<WorkzoneEntity[]> {
    const workzoneData = await parseCsvFile(this.cvsPath);
    const workzoneEntities = await Promise.all(
      workzoneData.map(async (data) => {
        const workzone = new WorkzoneEntity();
        workzone.name = data.name;

        return workzone;
      }),
    );

    return this.workzoneRepository.save(workzoneEntities);
  }
}
