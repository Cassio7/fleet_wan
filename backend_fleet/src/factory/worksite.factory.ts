import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { EquipmentEntity } from 'classes/entities/equipment.entity';
import { GroupEntity } from 'classes/entities/group.entity';
import { RentalEntity } from 'classes/entities/rental.entity';
import { ServiceEntity } from 'classes/entities/service.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { WorksiteEntity } from 'classes/entities/worksite.entity';
import { WorksiteHistoryEntity } from 'classes/entities/worksite-history.entity';
import { WorkzoneEntity } from 'classes/entities/workzone.entity';
import * as path from 'path';
import { parseCsvFile } from 'src/utils/utils';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class WorksiteFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/CANTIERI.csv');
  private readonly cvsPathV = path.resolve(process.cwd(), 'files/VEICOLI.csv');
  constructor(
    @InjectRepository(WorksiteEntity, 'readOnlyConnection')
    private worksiteRepository: Repository<WorksiteEntity>,
    @InjectRepository(WorkzoneEntity, 'readOnlyConnection')
    private workzoneRepository: Repository<WorkzoneEntity>,
    @InjectRepository(ServiceEntity, 'readOnlyConnection')
    private serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(EquipmentEntity, 'readOnlyConnection')
    private equipmentRepository: Repository<EquipmentEntity>,
    @InjectRepository(RentalEntity, 'readOnlyConnection')
    private rentalRepository: Repository<RentalEntity>,
    @InjectRepository(VehicleEntity, 'readOnlyConnection')
    private vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(GroupEntity, 'readOnlyConnection')
    private groupRepository: Repository<GroupEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  async createDefaultWorksite(): Promise<void> {
    const worksiteData = await parseCsvFile(this.cvsPath);
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const data of worksiteData) {
        const worksite = queryRunner.manager
          .getRepository(WorksiteEntity)
          .create({
            name: data.name,
            group: await this.groupRepository.findOne({
              where: { id: data.groupId },
            }),
          });

        await queryRunner.manager.save(worksite);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore durante la creazione dei cantieri:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createDefaultVehicleWorksite() {
    const vehicleWorksiteData = await parseCsvFile(this.cvsPathV);
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const data of vehicleWorksiteData) {
        const vehicle = await this.vehicleRepository.findOne({
          where: {
            veId: data.veId,
          },
        });

        if (!vehicle) {
          console.log(`Veicolo con veId: ${data.veId} non trovato`);
          continue;
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
        vehicle.fleet_install = new Date(data.fleet_install);
        if (data.fleet_antenna_number) {
          vehicle.fleet_antenna_number = data.fleet_antenna_number;
        }
        vehicle.active_csv = data.active_csv;

        await queryRunner.manager.getRepository(VehicleEntity).update(
          {
            key: vehicle.key,
          },
          vehicle,
        );

        if (vehicle.worksite) {
          const worksiteHistory = queryRunner.manager
            .getRepository(WorksiteHistoryEntity)
            .create({
              dateFrom: new Date(),
              dateTo: null,
              comment: 'Assegnazione iniziale',
              vehicle: vehicle,
              worksite: vehicle.worksite,
            });
          await queryRunner.manager
            .getRepository(WorksiteHistoryEntity)
            .save(worksiteHistory);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        'Errore durante la creazione del veicolo e della sua storia:',
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
