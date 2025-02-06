import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EquipmentEntity } from 'classes/entities/equipment.entity';
import { RentalEntity } from 'classes/entities/rental.entity';
import { ServiceEntity } from 'classes/entities/service.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { WorkzoneEntity } from 'classes/entities/workzone.entity';
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
    @InjectRepository(WorkzoneEntity, 'mainConnection')
    private workzoneRepository: Repository<WorkzoneEntity>,
    @InjectRepository(ServiceEntity, 'mainConnection')
    private serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(EquipmentEntity, 'mainConnection')
    private equipmentRepository: Repository<EquipmentEntity>,
    @InjectRepository(RentalEntity, 'mainConnection')
    private rentalRepository: Repository<RentalEntity>,
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
    await Promise.all(
      vehicleWorksiteData.map(async (data) => {
        const vehicle = await this.vehicleRepository.findOne({
          where: {
            veId: data.veId,
          },
        });
        if (!vehicle) {
          return;
        }
        vehicle.worksite = await this.worksiteRepository.findOne({
          where: {
            id: data.worksiteId,
          },
        });
        vehicle.workzone = await this.workzoneRepository.findOne({
          where: {
            id: data.workzoneId,
          },
        });
        vehicle.service = await this.serviceRepository.findOne({
          where: {
            id: data.serviceId,
          },
        });
        if (data.equipmentId) {
          vehicle.equipment = await this.equipmentRepository.findOne({
            where: {
              id: data.equipmentId,
            },
          });
        }
        if (data.rentalId) {
          vehicle.rental = await this.rentalRepository.findOne({
            where: {
              id: data.rentalId,
            },
          });
        }
        vehicle.allestimento = data.Allestimento;
        if (data.antenna_setting) {
          vehicle.antenna_setting = data.antenna_setting;
        }
        if (data.registration) {
          vehicle.registration = data.registration;
        }
        vehicle.model_csv = data.model_csv;
        if (data.euro) {
          vehicle.euro = data.euro;
        }
        vehicle.worksite_priority = data.worksite_priority;
        vehicle.electrical = data.electrical;
        vehicle.fleet_number = data.fleet_number;
        vehicle.fleet_install = data.fleet_install;
        if (data.fleet_antenna_number) {
          vehicle.fleet_antenna_number = data.fleet_antenna_number;
        }
        vehicle.active_csv = data.active_csv;
        // uso save invece di update così si aggiorna la variabile di version
        await this.vehicleRepository.save(vehicle);
      }),
    );
  }
}
