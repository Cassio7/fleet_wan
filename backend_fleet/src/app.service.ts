import { CompanyFactoryService } from './factory/company.factory';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { GroupService } from './services/group/group.service';
import { VehicleService } from './services/vehicle/vehicle.service';
import { SessionService } from './services/session/session.service';
import { Cron } from '@nestjs/schedule';
import { TagService } from './services/tag/tag.service';
import { CompanyService } from './services/company/company.service';
import { UserFactoryService } from './factory/user.factory';
import { WorksiteFactoryService } from './factory/worksite.factory';
import { GroupFactoryService } from './factory/group.factory';
import { WorksiteGroupFactoryService } from './factory/worksite_group.factory';

import { getDaysInRange } from './utils/utils';
import { RoleCompanyFactoryService } from './factory/role_company.factory';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly groupService: GroupService,
    private readonly vehicleService: VehicleService,
    private readonly sessionService: SessionService,
    private readonly tagService: TagService,
    private readonly companyService: CompanyService,
    private readonly userFactoryService: UserFactoryService,
    private readonly companyFactoryService: CompanyFactoryService,
    private readonly worksiteFactoryService: WorksiteFactoryService,
    private readonly groupFactoryService: GroupFactoryService,
    private readonly worksiteGroupFactoryService: WorksiteGroupFactoryService,
    private readonly roleCompanyFactoryService: RoleCompanyFactoryService,
  ) {}

  // popolo database all'avvio
  async onModuleInit() {
    await this.putDefaultData();
    //await this.putDbData();
    //await this.putDbDataBasicFor();
    //await this.putDbDataBasicForEach();
    await this.putDbDataBasicForAdvance();
    //await this.putDbDataNewReverse();
    //await this.putDbDataLast();
    //await this.putDbData5min();
  }

  async putDefaultData() {
    await this.userFactoryService.createDefaultUser();
    await this.userFactoryService.createDefaultRoles();
    await this.userFactoryService.createDefaultUserRoles();
    await this.companyFactoryService.createDefaultCompanies();
    await this.roleCompanyFactoryService.createDefaultRoleCompany();
    await this.groupFactoryService.createDefaultGroup();
    await this.worksiteFactoryService.createDefaultWorksite();
    await this.worksiteGroupFactoryService.createDefaultWorksiteGroup();
  }

  async putDbData() {
    const startDate = '2024-10-01T00:00:00.000Z';
    const endDate = '2024-10-31T00:00:00.000Z';

    // Parallel vehicle list retrievals
    const vehicleListPromises = [
      this.vehicleService.getVehicleList(254, 313),
      this.vehicleService.getVehicleList(305, 650),
      this.vehicleService.getVehicleList(324, 688),
    ];
    await Promise.all(vehicleListPromises);

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);

    // Fetch vehicles and default worksite in parallel
    const [vehicles] = await Promise.all([
      this.vehicleService.getAllVehicles(),
      this.worksiteFactoryService.createDefaultVehicleWorksite(),
    ]);

    // Batch process companies to reduce database calls
    const companyMap = new Map();
    for (const vehicle of vehicles) {
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        companyMap.set(vehicle.veId, company);
      }
    }

    // Use batch processing with concurrency limit
    const processBatch = async (batch) => {
      const batchPromises = batch.map(async (vehicle) => {
        const company = companyMap.get(vehicle.veId);
        console.log(
          `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
        );
        if (company) {
          const dayRequests = daysInRange.slice(0, -1).map((day) => {
            const datefrom = day;
            const dateto = new Date(datefrom);
            dateto.setHours(23, 59, 59, 0);

            return Promise.all([
              this.sessionService.getSessionist(
                company.suId,
                vehicle.veId,
                datefrom.toISOString(),
                dateto.toISOString(),
              ),
              this.tagService.putTagHistory(
                company.suId,
                vehicle.veId,
                datefrom.toISOString(),
                dateto.toISOString(),
              ),
            ]);
          });

          return Promise.all(dayRequests);
        }
      });

      return Promise.all(batchPromises);
    };

    // Process vehicles in batches to control concurrency
    const batchSize = 10;
    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      await processBatch(batch);
    }
  }
  /**
   * al momento la migliore nel complesso, semplice ciclo for ma non funziona con range temporali alti
   */
  async putDbDataBasicFor() {
    const startDate = '2024-10-20T00:00:00.000Z';
    const endDate = '2024-10-30T00:00:00.000Z';
    //const endDate = new Date().toISOString();
    //await this.groupService.setGroupList(254);
    await this.vehicleService.getVehicleList(254, 313);
    await this.vehicleService.getVehicleList(305, 650);
    await this.vehicleService.getVehicleList(324, 688);

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);

    const vehicles = await this.vehicleService.getAllVehicles();

    // const vehicles = [];
    // const vehicle1 = await this.vehicleService.getVehicleById(2954);
    // vehicles.push(vehicle1);
    // const vehicle2 = await this.vehicleService.getVehicleById(3517);
    // vehicles.push(vehicle2);
    await this.worksiteFactoryService.createDefaultVehicleWorksite();

    // mappo per ridurre il numero di chiamate interne
    const companyMap = new Map();
    for (const vehicle of vehicles) {
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        companyMap.set(vehicle.veId, company);
      }
    }

    for (const vehicle of vehicles) {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );
      const company = companyMap.get(vehicle.veId);
      if (company) {
        const requests = daysInRange.slice(0, -1).map((day) => {
          const datefrom = day;
          const dateto = new Date(datefrom);
          dateto.setHours(23, 59, 59, 0);
          console.log(datefrom.toISOString());
          return Promise.all([
            this.sessionService.getSessionist(
              company.suId,
              vehicle.veId,
              datefrom.toISOString(),
              dateto.toISOString(),
            ),
            this.tagService.putTagHistory(
              company.suId,
              vehicle.veId,
              datefrom.toISOString(),
              dateto.toISOString(),
            ),
          ]);
        });
        await Promise.all(requests);
      } else {
        console.log(company);
      }
    }
  }

  async putDbDataBasicForEach() {
    const startDate = '2024-10-20T00:00:00.000Z';
    const endDate = '2024-10-30T00:00:00.000Z';
    //const endDate = new Date().toISOString();
    //await this.groupService.setGroupList(254);
    await this.vehicleService.getVehicleList(254, 313);
    await this.vehicleService.getVehicleList(305, 650);
    await this.vehicleService.getVehicleList(324, 688);

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);

    const vehicles = await this.vehicleService.getAllVehicles();
    await this.worksiteFactoryService.createDefaultVehicleWorksite();

    // mappo per ridurre il numero di chiamate interne
    const companyMap = new Map();
    for (const vehicle of vehicles) {
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        companyMap.set(vehicle.veId, company);
      }
    }

    vehicles.forEach(async (vehicle) => {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );
      const company = companyMap.get(vehicle.veId);
      if (company) {
        const requests = daysInRange.slice(0, -1).map((day) => {
          const datefrom = day;
          const dateto = new Date(datefrom);
          dateto.setHours(23, 59, 59, 0);
          console.log(datefrom.toISOString());
          return Promise.all([
            this.sessionService.getSessionist(
              company.suId,
              vehicle.veId,
              datefrom.toISOString(),
              dateto.toISOString(),
            ),
            this.tagService.putTagHistory(
              company.suId,
              vehicle.veId,
              datefrom.toISOString(),
              dateto.toISOString(),
            ),
          ]);
        });
        await Promise.all(requests);
      } else {
        console.log(company);
      }
    });
  }

  async putDbDataBasicForAdvance() {
    const startDate = '2024-01-01T00:00:00.000Z';
    const endDate = '2024-10-31T00:00:00.000Z';
    const batchSize = 100;

    await this.vehicleService.getVehicleList(254, 313);
    await this.vehicleService.getVehicleList(305, 650);
    await this.vehicleService.getVehicleList(324, 688);

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new); // Funzione che restituisce un array di giorni

    const vehicles = await this.vehicleService.getAllVehicles();
    // const vehicles = [];
    // const vehicle1 = await this.vehicleService.getVehicleById(2954);
    // vehicles.push(vehicle1);
    // const vehicle2 = await this.vehicleService.getVehicleById(3517);
    // vehicles.push(vehicle2);

    await this.worksiteFactoryService.createDefaultVehicleWorksite();

    // Creazione della mappa delle compagnie
    const companyMap = new Map();
    for (const vehicle of vehicles) {
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        companyMap.set(vehicle.veId, company);
      }
    }

    for (const vehicle of vehicles) {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );
      const company = companyMap.get(vehicle.veId);
      if (company) {
        // Suddivisione dei giorni in batch
        for (let i = 0; i < daysInRange.length; i += batchSize) {
          const batch = daysInRange.slice(i, i + batchSize);

          const requests = batch.map((day) => {
            const datefrom = day;
            const dateto = new Date(datefrom);
            dateto.setHours(23, 59, 59, 0);
            console.log(datefrom.toISOString());
            return Promise.all([
              this.sessionService.getSessionist(
                company.suId,
                vehicle.veId,
                datefrom.toISOString(),
                dateto.toISOString(),
              ),
              this.tagService.putTagHistory(
                company.suId,
                vehicle.veId,
                datefrom.toISOString(),
                dateto.toISOString(),
              ),
            ]);
          });

          // Esecuzione delle richieste per il batch corrente
          await Promise.all(requests);
        }
      } else {
        console.log(company);
      }
    }
  }

  async putDbDataNewReverse() {
    const startDate = '2024-10-01T00:00:00.000Z';
    const endDate = '2024-10-31T00:00:00.000Z';

    await this.vehicleService.getVehicleList(254, 313);
    await this.vehicleService.getVehicleList(305, 650);
    await this.vehicleService.getVehicleList(324, 688);

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const vehicles = await this.vehicleService.getAllVehicles();
    await this.worksiteFactoryService.createDefaultVehicleWorksite();

    // Mappo per ridurre il numero di chiamate interne
    const companyMap = new Map();
    for (const vehicle of vehicles) {
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        companyMap.set(vehicle.veId, company);
      }
    }

    const processVehicleBatch = async (vehicleBatch) => {
      await Promise.all(
        vehicleBatch.map(async (vehicle) => {
          console.log(
            `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
          );
          const company = companyMap.get(vehicle.veId);
          if (company) {
            const requests = daysInRange.slice(0, -1).map((day) => {
              const datefrom = day;
              const dateto = new Date(datefrom);
              dateto.setHours(23, 59, 59, 0);

              return Promise.all([
                this.sessionService.getSessionist(
                  company.suId,
                  vehicle.veId,
                  datefrom.toISOString(),
                  dateto.toISOString(),
                ),
                this.tagService.putTagHistory(
                  company.suId,
                  vehicle.veId,
                  datefrom.toISOString(),
                  dateto.toISOString(),
                ),
              ]);
            });
            await Promise.all(requests); // Concorrenza per tutti i giorni
          }
        }),
      );
    };

    const vehicleBatchSize = 10; // Batch di veicoli
    for (let i = 0; i < vehicles.length; i += vehicleBatchSize) {
      const vehicleBatch = vehicles.slice(i, i + vehicleBatchSize);
      await processVehicleBatch(vehicleBatch);
    }
  }

  async putDbDataLast() {
    const startDate = '2024-10-01T00:00:00.000Z';
    const endDate = '2024-10-31T00:00:00.000Z';

    await this.vehicleService.getVehicleList(254, 313);
    await this.vehicleService.getVehicleList(305, 650);
    await this.vehicleService.getVehicleList(324, 688);

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const vehicles = await this.vehicleService.getAllVehicles();
    await this.worksiteFactoryService.createDefaultVehicleWorksite();

    // Mappo per ridurre il numero di chiamate interne
    const companyMap = new Map();
    for (const vehicle of vehicles) {
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        companyMap.set(vehicle.veId, company);
      }
    }

    const processVehicleBatch = async (vehicleBatch) => {
      await Promise.all(
        vehicleBatch.map(async (vehicle) => {
          console.log(
            `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
          );
          const company = companyMap.get(vehicle.veId);
          if (company) {
            const requests = daysInRange.slice(0, -1).map((day) => {
              const datefrom = day;
              const dateto = new Date(datefrom);
              dateto.setHours(23, 59, 59, 0);

              return Promise.all([
                this.sessionService.getSessionist(
                  company.suId,
                  vehicle.veId,
                  datefrom.toISOString(),
                  dateto.toISOString(),
                ),
                this.tagService.putTagHistory(
                  company.suId,
                  vehicle.veId,
                  datefrom.toISOString(),
                  dateto.toISOString(),
                ),
              ]);
            });
            await Promise.all(requests); // Concorrenza per tutti i giorni
          }
        }),
      );
    };

    const vehicleBatchSize = 20; // Batch di veicoli
    for (let i = 0; i < vehicles.length; i += vehicleBatchSize) {
      const vehicleBatch = vehicles.slice(i, i + vehicleBatchSize);
      await processVehicleBatch(vehicleBatch);
    }
  }
  // @Cron('0 0 * * *')
  // async putDbDataDaily() {
  //   const startDate = new Date(
  //     new Date().getTime() - 24 * 60 * 60 * 1000,
  //   ).toISOString();
  //   const endDate = new Date().toISOString();

  //   await this.groupService.getGroupList();
  //   const groups = await this.groupService.getAllGroups();
  //   for (const group of groups) {
  //     await this.vehicleService.getVehicleList(group.vgId);
  //   }
  //   const vehicles = await this.vehicleService.getAllVehicles();
  //   for (const vehicle of vehicles) {
  //     console.log(`${vehicle.veId} - ${vehicle.id}`);
  //     await this.sessionService.getSessionist(vehicle.veId, startDate, endDate);
  //   }
  // }

  //@Cron('*/5 * * * *')
  async putDbData5min() {
    const startDate = new Date(
      new Date().getTime() - 5 * 60 * 1000, // 5 minuti
    ).toISOString();
    const endDate = new Date().toISOString();
    await this.vehicleService.getVehicleList(254, 313);
    await this.vehicleService.getVehicleList(305, 650);
    await this.vehicleService.getVehicleList(324, 688);

    const vehicles = await this.vehicleService.getAllVehicles();
    for (const vehicle of vehicles) {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        await this.sessionService.getSessionist(
          company.suId,
          vehicle.veId,
          startDate,
          endDate,
        );
        console.log(`Tag`);
        await this.tagService.putTagHistory(
          company.suId,
          vehicle.veId,
          startDate,
          endDate,
        );
      }
    }
  }
}
