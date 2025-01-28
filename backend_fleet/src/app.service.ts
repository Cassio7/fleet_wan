import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CompanyFactoryService } from './factory/company.factory';
import { GroupFactoryService } from './factory/group.factory';
import { UserFactoryService } from './factory/user.factory';
import { WorksiteFactoryService } from './factory/worksite.factory';
import { WorksiteGroupFactoryService } from './factory/worksite_group.factory';
import { CompanyService } from './services/company/company.service';
import { RealtimeService } from './services/realtime/realtime.service';
import { SessionService } from './services/session/session.service';
import { TagService } from './services/tag/tag.service';
import { VehicleService } from './services/vehicle/vehicle.service';

import { AssociationFactoryService } from './factory/association.factory';
import { CategoryFactoryService } from './factory/category.factory';
import { AnomalyService } from './services/anomaly/anomaly.service';
import { getDaysInRange } from './utils/utils';

import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { AssociationService } from './services/association/association.service';

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
    private readonly realtimeService: RealtimeService,
    private readonly associationService: AssociationService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // popolo database all'avvio
  async onModuleInit() {
    const startDate = '2025-01-01T00:00:00.000Z';
    //const endDate = '2024-12-10T00:00:00.000Z';
    const endDate = new Date(
      new Date().getTime() + 2 * 60 * 60 * 1000,
    ).toISOString();
    //await this.putDefaultData();
    //await this.putDbData(startDate, endDate);
    //await this.associationService.setVehiclesAssociateAllUsersRedis(),
    //await this.putDbData3min();
    //await this.anomalyCheck(startDate, endDate);
    //await this.dailyAnomalyCheck();
    //await this.setAnomaly();
    //await this.updateRealtime();
    await this.redis.publish('realtime_channel', 'Applicazione inizializzata');
  }

  async putDefaultData() {
    await this.redis.flushdb();
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
  async putDbData(start: string, end: string) {
    const startDate = start;
    const endDate = end;

    console.log('Data inizio: ' + startDate + ' Data fine: ' + endDate);
    const batchSize = 100;

    await this.vehicleService.getVehicleList(254, 313); //Gesenu principale
    //await this.vehicleService.getVehicleList(254, 683); //Gesenu dismessi
    await this.vehicleService.getVehicleList(305, 650); //TSA principale
    await this.vehicleService.getVehicleList(324, 688); //Fiumicino principale

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new); // Funzione che restituisce un array di giorni

    const vehicles = await this.vehicleService.getAllVehicles();

    // da commentare dopo primo run
    //await this.worksiteFactoryService.createDefaultVehicleWorksite();

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
    try {
      const dateFrom = new Date(start);
      const dateTo = new Date(end);
      const daysInRange = getDaysInRange(dateFrom, dateTo);

      await Promise.all(
        daysInRange.slice(0, -1).map(async (day) => {
          const datefrom = day;
          const dateto = new Date(datefrom);
          dateto.setDate(dateto.getDate() + 1);
          const data = await this.anomalyService.checkErrors(
            datefrom,
            dateto.toISOString(),
          );
          if (data && data.length > 0) {
            await Promise.all(
              data.map((item) => this.createAnomalyFromSession(item)),
            );
          }
        }),
      );

      console.log('Anomaly check aggiornato alle: ' + new Date().toISOString());
    } catch (error) {
      console.error('Errore durante il controllo delle anomalie:', error);
    }
  }

  /**
   *
   * @param item
   * @returns
   */
  private async createAnomalyFromSession(item: any) {
    const veId = item.veId;
    let date = null;
    let gps = null;
    let antenna = null;
    let detection_quality_avg = null;
    const session = null;

    if (item.sessions && item.sessions[0]) {
      date = item.sessions[0].date || null;
      if (item.sessions[0].anomalies) {
        gps = item.sessions[0].anomalies.GPS || null;
        antenna = item.sessions[0].anomalies.Antenna || null;
        detection_quality_avg =
          item.sessions[0].anomalies.detection_quality_avg || null;
      }
      return this.anomalyService.createAnomaly(
        veId,
        date,
        gps,
        antenna,
        detection_quality_avg,
        session,
      );
    }

    return null;
  }

  //@Cron('58 23 * * *')
  async dailyAnomalyCheck() {
    try {
      const datefrom = new Date();
      const dateto = new Date(datefrom);
      datefrom.setHours(0, 0, 0, 0);
      dateto.setDate(dateto.getDate() + 1);
      const data = await this.anomalyService.checkErrors(
        datefrom.toISOString(),
        dateto.toISOString(),
      );
      if (data && data.length > 0) {
        const anomalyPromises = data.flatMap((item) => {
          const veId = item.veId;
          let date = null;
          let gps = null;
          let antenna = null;
          let detection_quality_avg = null;
          const session = item.anomaliaSessione || null;

          if (item.sessions && item.sessions[0]) {
            date = item.sessions[0].date || null;
            if (item.sessions[0].anomalies) {
              gps = item.sessions[0].anomalies.GPS || null;
              antenna = item.sessions[0].anomalies.Antenna || null;
              detection_quality_avg =
                item.sessions[0].anomalies.detection_quality_avg || null;
            }
          }

          return this.anomalyService.createAnomaly(
            veId,
            date,
            gps,
            antenna,
            detection_quality_avg,
            session,
          );
        });

        await Promise.all(anomalyPromises);
      }
      console.log(
        'Daily Anomaly check aggiornato alle: ' + new Date().toISOString(),
      );
    } catch (error) {
      console.error(
        'Errore durante il controllo giornaliero delle anomalie:',
        error,
      );
    }
  }

  /**
   * Imposta le anomalies su redis del giorno precedente, di oggi ed anche il last
   */
  //@Cron('02 2 * * *')
  async setAnomaly() {
    const keys = await this.redis.keys('*Anomaly:*');
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
    const now = new Date();

    const todayAnomalies = await this.anomalyService.getAnomalyByDate(1, now);
    const lastAnomalies = await this.anomalyService.getLastAnomaly(1);

    await this.anomalyService.setTodayAnomalyRedis(todayAnomalies);
    await this.anomalyService.setLastAnomalyRedis(lastAnomalies);

    // logica set redis giorno prima al momento dismessa

    // const dayBefore = new Date(
    //   now.getFullYear(),
    //   now.getMonth(),
    //   now.getDate() - 1,
    // );
    // const yesterdayAnomalies = await this.anomalyService.getAnomalyByDate(
    //   vehicleIds,
    //   dayBefore,
    // );
    // await this.anomalyService.setDayBeforeAnomalyRedis(yesterdayAnomalies);
  }

  //@Cron('*/5 * * * *')
  async updateRealtime() {
    await this.realtimeService.clearRealtime();
    await this.realtimeService.setRealtime(254, 313); //Gesenu principale
    await this.realtimeService.setRealtime(305, 650); //TSA principale
    await this.realtimeService.setRealtime(324, 688); //Fiumicino principale
    const vehicles = await this.vehicleService.getAllVehicles();
    const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
    const realtimes = await this.realtimeService.getTimesByVeId(vehicleIds);
    const latestRealtimes =
      await this.realtimeService.calculateLastValid(realtimes);
    await this.realtimeService.setLastValidRedis(latestRealtimes);
    console.log('Realtime aggiornato alle: ' + new Date().toISOString());
  }
}
