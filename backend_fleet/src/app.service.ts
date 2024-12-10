import { CompanyFactoryService } from './factory/company.factory';
import { Injectable, OnModuleInit } from '@nestjs/common';
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
import { AssociationFactoryService } from './factory/association.factory';
import { CategoryFactoryService } from './factory/category.factory';
import { AnomalyService } from './services/anomaly/anomaly.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly sessionService: SessionService,
    private readonly tagService: TagService,
    private readonly companyService: CompanyService,
    private readonly userFactoryService: UserFactoryService,
    private readonly companyFactoryService: CompanyFactoryService,
    private readonly worksiteFactoryService: WorksiteFactoryService,
    private readonly groupFactoryService: GroupFactoryService,
    private readonly worksiteGroupFactoryService: WorksiteGroupFactoryService,
    private readonly associationFactoryService: AssociationFactoryService,
    private readonly categoryFactoryService: CategoryFactoryService,
    private readonly anomalyService: AnomalyService,
  ) {}

  // popolo database all'avvio
  async onModuleInit() {
    const startDate = '2024-11-25T00:00:00.000Z';
    const endDate = '2024-12-09T00:00:00.000Z';
    // const endDate = new Date(
    //   new Date().getTime() + 2 * 60 * 60 * 1000,
    // ).toISOString();
    //await this.putDefaultData();
    //await this.putDbDataBasicForAdvance(startDate, endDate);
    //await this.putDbData3min();
    //await this.anomalyCheck(startDate, endDate);
  }

  async putDefaultData() {
    await this.userFactoryService.createDefaultRoles();
    await this.userFactoryService.createDefaultUser();
    await this.companyFactoryService.createDefaultCompanies();
    await this.groupFactoryService.createDefaultGroup();
    await this.worksiteFactoryService.createDefaultWorksite();
    await this.worksiteGroupFactoryService.createDefaultWorksiteGroup();
    await this.associationFactoryService.createDefaultAssociation();
    await this.categoryFactoryService.createDefaultCategory();
  }

  /**
   * IL PRESCELTO
   */
  async putDbDataBasicForAdvance(start: string, end: string) {
    const startDate = start;
    const endDate = end;

    console.log('Data inizio: ' + startDate + ' Data fine: ' + endDate);
    const batchSize = 100;

    await this.vehicleService.getVehicleList(254, 313); //Gesenu principale
    await this.vehicleService.getVehicleList(254, 683); //Gesenu dismessi
    await this.vehicleService.getVehicleList(305, 650); //TSA principale
    await this.vehicleService.getVehicleList(324, 688); //Fiumicino principale

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new); // Funzione che restituisce un array di giorni

    const vehicles = await this.vehicleService.getAllVehicles();
    // const vehicles = [];
    // const vehicle1 = await this.vehicleService.getVehicleById(3796);
    // vehicles.push(vehicle1);
    // const vehicle2 = await this.vehicleService.getVehicleById(3517);
    // vehicles.push(vehicle2);
    await this.worksiteFactoryService.createDefaultVehicleWorksite();

    // await this.sessionService.getSessionist(324, 3779, startDate, endDate);
    // return true;

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
            console.log(dateto);
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

  //@Cron('*/3 * * * *')
  async putDbData3min() {
    const startDate = new Date(
      new Date().getTime() - 3 * 60 * 1000, // 3 minuti
    ).toISOString();
    const endDate = new Date(
      new Date().getTime() + 2 * 60 * 60 * 1000,
    ).toISOString();
    console.log('Data inizio: ' + startDate + ' Data fine: ' + endDate);
    await this.vehicleService.getVehicleList(254, 313);
    await this.vehicleService.getVehicleList(305, 650);
    await this.vehicleService.getVehicleList(324, 688);

    const vehicles = await this.vehicleService.getAllVehicles();

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
        await this.sessionService.getSessionist(
          company.suId,
          vehicle.veId,
          startDate,
          endDate,
        );
        await this.tagService.putTagHistory(
          company.suId,
          vehicle.veId,
          startDate,
          endDate,
        );
      }
    }
  }

  async anomalyCheck(start: string, end: string) {
    const dateFrom_new = new Date(start);
    const dateTo_new = new Date(end);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    await Promise.all(
      daysInRange.slice(0, -1).map(async (day) => {
        const datefrom = day;
        const dateto = new Date(datefrom);
        dateto.setDate(dateto.getDate() + 1);
        const data = await this.anomalyService.checkErrors(
          datefrom,
          dateto.toISOString(),
        );
        if (data !== false) {
          const promises = data.map(async (item) => {
            const veId = item.veId;
            const session = item.anomaliaSessione || null;
            let gps = null;
            let antenna = null;
            let date = null;
            if (item.sessions[0]) {
              date = item.sessions[0].date || null;
              if (item.sessions[0].anomalies) {
                gps = item.sessions[0].anomalies.GPS || null;
                antenna = item.sessions[0].anomalies.Antenna || null;
              }
            }
            await this.anomalyService.createAnomaly(
              veId,
              date,
              gps,
              antenna,
              session,
            );
          });
          await Promise.all(promises);
        }
      }),
    );
  }
}
