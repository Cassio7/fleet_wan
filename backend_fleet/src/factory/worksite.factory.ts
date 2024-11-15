import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';
import { Repository } from 'typeorm';

@Injectable()
export class WorksiteFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/CANTIERI.csv');
  private readonly cvsPathV = path.resolve(process.cwd(), 'files/VEICOLI.csv');
  constructor(
    @InjectRepository(WorksiteEntity, 'mainConnection')
    private worksiteRepository: Repository<WorksiteEntity>,

    @InjectRepository(VehicleEntity, 'mainConnection')
    private vehicleRepository: Repository<VehicleEntity>,
  ) {}

  async createDefaultWorksite(): Promise<WorksiteEntity[]> {
    const worksiteData = await parseCsvFile(this.cvsPath);

    const worksiteEntities = worksiteData.map((data) => {
      const worksite = new WorksiteEntity();
      worksite.name = data.name;
      return worksite;
    });

    return this.worksiteRepository.save(worksiteEntities);
  }

  async createDefaultVehicleWorksite() {
    const vehicleWorksiteData = await parseCsvFile(this.cvsPathV);

    vehicleWorksiteData.map(async (data) => {
      const vehicle = await this.vehicleRepository.findOne({
        where: {
          veId: data.veId,
        },
      });
      vehicle.worksite = await this.worksiteRepository.findOne({
        where: {
          id: data.worksiteId,
        },
      });
      await this.vehicleRepository.update(
        {
          key: vehicle.key,
        },
        vehicle,
      );
    });
  }
}
