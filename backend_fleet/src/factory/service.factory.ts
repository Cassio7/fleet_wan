import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceEntity } from 'src/classes/entities/service.entity';
import { Repository } from 'typeorm';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';

@Injectable()
export class ServiceFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/SERVIZI.csv');
  constructor(
    @InjectRepository(ServiceEntity, 'readOnlyConnection')
    private serviceRepository: Repository<ServiceEntity>,
  ) {}

  async createDefaultService(): Promise<ServiceEntity[]> {
    const serviceData = await parseCsvFile(this.cvsPath);
    const serviceEntities = await Promise.all(
      serviceData.map(async (data) => {
        const service = new ServiceEntity();
        service.name = data.name;

        return service;
      }),
    );

    return this.serviceRepository.save(serviceEntities);
  }
}
