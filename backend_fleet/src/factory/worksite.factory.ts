import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as path from 'path';
import { EquipmentEntity } from 'src/classes/entities/equipment.entity';
import { GroupEntity } from 'src/classes/entities/group.entity';
import { RentalEntity } from 'src/classes/entities/rental.entity';
import { ServiceEntity } from 'src/classes/entities/service.entity';
import { VehicleEntity } from 'src/classes/entities/vehicle.entity';
import { WorksiteHistoryEntity } from 'src/classes/entities/worksite-history.entity';
import { WorksiteEntity } from 'src/classes/entities/worksite.entity';
import { WorkzoneEntity } from 'src/classes/entities/workzone.entity';
import { parseCsvFile } from 'src/utils/utils';
import { DataSource } from 'typeorm';

@Injectable()
export class WorksiteFactoryService {
  private readonly cvsPath = path.resolve(process.cwd(), 'files/CANTIERI.csv');
  private readonly cvsPathV = path.resolve(process.cwd(), 'files/VEICOLI.csv');

  constructor(
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  async createDefaultWorksite(): Promise<void> {
    const worksiteData = await parseCsvFile(this.cvsPath);
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      for (const data of worksiteData) {
        const group = await queryRunner.manager
          .getRepository(GroupEntity)
          .findOne({
            where: { id: data.groupId },
          });

        if (!group) {
          throw new Error(`Comune non trovato: ${data.groupId}`);
        }

        const worksite = queryRunner.manager
          .getRepository(WorksiteEntity)
          .create({
            name: data.name,
            group: group,
          });

        await queryRunner.manager.getRepository(WorksiteEntity).save(worksite);
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

  async createDefaultVehicleWorksite(): Promise<void> {
    const vehicleWorksiteData = await parseCsvFile(this.cvsPathV);
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const data of vehicleWorksiteData) {
        const vehicle = await queryRunner.manager
          .getRepository(VehicleEntity)
          .findOne({
            where: {
              veId: data.veId,
            },
          });

        if (!vehicle) {
          console.log(`Veicolo con veId: ${data.veId} non trovato`);
          continue;
        }

        vehicle.worksite = await queryRunner.manager
          .getRepository(WorksiteEntity)
          .findOne({
            where: {
              id: data.worksiteId,
            },
          });

        vehicle.workzone = await queryRunner.manager
          .getRepository(WorkzoneEntity)
          .findOne({
            where: {
              id: data.workzoneId,
            },
          });

        vehicle.service = await queryRunner.manager
          .getRepository(ServiceEntity)
          .findOne({
            where: {
              id: data.serviceId,
            },
          });

        if (data.equipmentId) {
          vehicle.equipment = await queryRunner.manager
            .getRepository(EquipmentEntity)
            .findOne({
              where: {
                id: data.equipmentId,
              },
            });
        }

        if (data.rentalId) {
          vehicle.rental = await queryRunner.manager
            .getRepository(RentalEntity)
            .findOne({
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
