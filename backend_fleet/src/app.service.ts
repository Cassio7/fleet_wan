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
import { ServiceFactoryService } from './factory/service.factory';
import { AnomalyService } from './services/anomaly/anomaly.service';
import { getDaysInRange } from './utils/utils';

import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { EquipmentFacotoryService } from './factory/equipment.factory';
import { RentalFactoryService } from './factory/rental.factory';
import { WorkzoneFacotoryService } from './factory/workzone.factory';
import { AssociationService } from './services/association/association.service';
import { ControlService } from './services/control/control.service';

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
    private readonly serviceFactoryService: ServiceFactoryService,
    private readonly rentalFactoryService: RentalFactoryService,
    private readonly equipmentFacotoryService: EquipmentFacotoryService,
    private readonly workzoneFacotoryService: WorkzoneFacotoryService,
    private readonly anomalyService: AnomalyService,
    private readonly realtimeService: RealtimeService,
    private readonly controlService: ControlService,
    private readonly associationService: AssociationService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // popolo database all'avvio
  async onModuleInit() {
    const startDate = '2025-03-04T00:00:00.000Z';
    //const endDate = '2025-03-05T00:00:00.000Z';
    const endDate = new Date(
      new Date().getTime() + 2 * 60 * 60 * 1000,
    ).toISOString();
    //await this.putDefaultData();
    //await this.putDbDataMix(startDate, endDate); // da usare nuovo
    //await this.associationService.setVehiclesAssociateAllUsersRedis(),
    //await this.putDbDataCronOne();
    //await this.anomalyCheck(startDate, endDate);
    //await this.dailyAnomalyCheck();
    //await this.setAnomaly();
    //await this.updateRealtime();
    await this.redis.publish('realtime_channel', 'Applicazione inizializzata');
  }

  async putDefaultData() {
    //await this.redis.flushdb();
    await this.userFactoryService.createDefaultRoles();
    await this.userFactoryService.createDefaultUser();
    await this.companyFactoryService.createDefaultCompanies();
    await this.groupFactoryService.createDefaultGroup();
    await this.worksiteFactoryService.createDefaultWorksite();
    await this.worksiteGroupFactoryService.createDefaultWorksiteGroup();
    await this.associationFactoryService.createDefaultAssociation();
    await this.serviceFactoryService.createDefaultService();
    await this.rentalFactoryService.createDefaultRental();
    await this.equipmentFacotoryService.createDefaultEquipment();
    await this.workzoneFacotoryService.createDefaultWorkzone();
  }

  /**
   * VELOCE MA DUPLICATI PER I TAG
   * Recupera tutti i dati dei veicoli, inserisce tutto in parallelo
   * @param start
   * @param end
   */
  async putDbData(start: string, end: string) {
    const startDate = start;
    const endDate = end;

    console.log('Data inizio: ' + startDate + ' Data fine: ' + endDate);
    const batchSize = 50;

    await this.vehicleService.getVehicleList(254, 313); //Gesenu principale
    //await this.vehicleService.getVehicleList(254, 683); //Gesenu dismessi
    await this.vehicleService.getVehicleList(305, 650); //TSA principale
    await this.vehicleService.getVehicleList(324, 688); //Fiumicino principale

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new); // Funzione che restituisce un array di giorni

    // da commentare dopo primo run
    //await this.worksiteFactoryService.createDefaultVehicleWorksite();

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
      }
    }
    const vehicleIds = vehicles.map((v) => v.veId);
    await Promise.all([
      this.sessionService.getLastValidSessionByVeIds(vehicleIds),
      this.sessionService.getLastHistoryByVeIds(vehicleIds),
    ]);
  }

  /**
   * PIU LENTA MA NO DUPLICATI PER I TAG
   * Recupera tutti i dati dei veicoli, inserisce le sessioni in parallelo ma i tag giorno per giorno
   * @param start inizio
   * @param end fine
   */
  async putDbDataMix(start: string, end: string) {
    const startDate = start;
    const endDate = end;

    console.log('Data inizio: ' + startDate + ' Data fine: ' + endDate);
    const batchSize = 50;

    // Carica tutti i veicoli dalle varie aziende
    await this.vehicleService.getVehicleList(254, 313); //Gesenu principale
    //await this.vehicleService.getVehicleList(254, 683); //Gesenu dismessi
    await this.vehicleService.getVehicleList(305, 650); //TSA principale
    await this.vehicleService.getVehicleList(324, 688); //Fiumicino principale

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new); // Funzione che restituisce un array di giorni

    // da commentare dopo primo run
    //await this.worksiteFactoryService.createDefaultVehicleWorksite();

    const vehicles = await this.vehicleService.getAllVehicles();

    // Creazione della mappa delle compagnie (ottimizzata)
    const companyMap = new Map();
    const companyPromises = vehicles.map(async (vehicle) => {
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        companyMap.set(vehicle.veId, company);
      }
    });
    await Promise.all(companyPromises);

    // Elabora ogni veicolo uno alla volta
    for (const vehicle of vehicles) {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );
      const company = companyMap.get(vehicle.veId);
      if (company) {
        // 1. GESTIONE SESSIONI CON BATCH
        for (let i = 0; i < daysInRange.length; i += batchSize) {
          const batch = daysInRange.slice(i, i + batchSize);
          const sessionRequests = batch.map((day) => {
            const datefrom = day;
            const dateto = new Date(datefrom);
            dateto.setHours(23, 59, 59, 0);
            console.log(dateto);

            return this.sessionService.getSessionist(
              company.suId,
              vehicle.veId,
              datefrom.toISOString(),
              dateto.toISOString(),
            );
          });

          // Esecuzione parallela di tutte le richieste nel batch corrente
          await Promise.all(sessionRequests);
        }
        if (!vehicle.allestimento) continue;
        // 2. GESTIONE TAG SEQUENZIALE
        for (const day of daysInRange) {
          const datefrom = day;
          const dateto = new Date(datefrom);
          dateto.setHours(23, 59, 59, 0);

          // Elabora un giorno alla volta per evitare duplicati
          await this.tagService.putTagHistory(
            company.suId,
            vehicle.veId,
            datefrom.toISOString(),
            dateto.toISOString(),
          );
        }
      }
    }

    // Elaborazione finale
    const vehicleIds = vehicles.map((v) => v.veId);
    await Promise.all([
      this.sessionService.getLastValidSessionByVeIds(vehicleIds),
      this.sessionService.getLastHistoryByVeIds(vehicleIds),
    ]);
  }

  /**
   * Inserisce i veicoli uno dopo l'altro
   */
  //@Cron('*/10 * * * *')
  async putDbDataCronOne() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startDate = now.toISOString();
    // 2 ore e 3 minuti
    const endDate = new Date(
      new Date().getTime() + 2 * 60 * 60 * 1000,
    ).toISOString();
    console.log('Data inizio: ' + startDate + ' Data fine: ' + endDate);
    await this.vehicleService.getVehicleList(254, 313); //Gesenu principale
    await this.vehicleService.getVehicleList(305, 650); //TSA principale
    await this.vehicleService.getVehicleList(324, 688); //Fiumicino principale

    const vehicles = await this.vehicleService.getAllVehicles();

    // Creazione della mappa delle compagnie
    const companyMap = new Map();
    for (const vehicle of vehicles) {
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        companyMap.set(vehicle.veId, company);
      }
    }

    // Invece di elaborare tutti i veicoli in parallelo con Promise.all
    for (const vehicle of vehicles.filter((vehicle) =>
      companyMap.has(vehicle.veId),
    )) {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );

      const company = companyMap.get(vehicle.veId);
      if (company) {
        // Per ogni veicolo, possiamo eseguire le operazioni di session e tag in parallelo
        const promises = [
          this.sessionService.getSessionist(
            company.suId,
            vehicle.veId,
            startDate,
            endDate,
          ),
        ];

        if (vehicle.allestimento) {
          promises.push(
            this.tagService.putTagHistory(
              company.suId,
              vehicle.veId,
              startDate,
              endDate,
            ),
          );
        }

        await Promise.all(promises);
      }
    }

    // inserire il calcolo dell ultima sessione valida
    const vehicleIds = vehicles.map((v) => v.veId);
    await Promise.all([
      this.sessionService.getLastValidSessionByVeIds(vehicleIds),
      this.sessionService.getLastHistoryByVeIds(vehicleIds),
    ]);
    console.log('Fine recupero');
  }

  async anomalyCheck(start: string, end: string) {
    try {
      const dateFrom = new Date(start);
      const dateTo = new Date(end);
      const daysInRange = getDaysInRange(dateFrom, dateTo);
      const daysToProcess = daysInRange.slice(0, -1); // Esclude l'ultimo elemento

      for (let i = 0; i < daysToProcess.length; i++) {
        const day = daysToProcess[i];
        const datefrom = day;
        const dateto = new Date(datefrom);
        dateto.setDate(dateto.getDate() + 1);

        const data = await this.controlService.checkErrors(
          datefrom,
          dateto.toISOString(),
        );

        if (!data || data.length === 0) {
          continue;
        }

        const processAnomalies = async (data, anomalyService) => {
          const anomalyPromises = data
            .filter((item) => item?.veId)
            .map(async (item) => {
              const anomalyData = {
                veId: item.veId,
                date: item.sessions?.[0]?.date ?? null,
                gps: item.sessions?.[0]?.anomalies?.GPS ?? null,
                antenna: item.sessions?.[0]?.anomalies?.Antenna ?? null,
                detection_quality:
                  item.sessions?.[0]?.anomalies?.detection_quality ?? null,
                session: item.sessions?.[0]?.anomalies?.open ?? null,
              };
              if (anomalyData.antenna?.includes('Tag letto')) {
                anomalyData.session = item.anomaliaSessione;
                anomalyData.gps = item.anomaliaSessione;
              }
              return anomalyService.createAnomaly(
                anomalyData.veId,
                anomalyData.date,
                anomalyData.gps,
                anomalyData.antenna,
                anomalyData.detection_quality,
                anomalyData.session,
              );
            });

          return Promise.all(anomalyPromises);
        };

        await processAnomalies(data, this.anomalyService);
      }
      console.log('Anomaly check aggiornato alle: ' + new Date().toISOString());
    } catch (error) {
      console.error('Errore durante il controllo delle anomalie:', error);
    }
  }

  //@Cron('58 22 * * *')
  async dailyAnomalyCheck() {
    try {
      const datefrom = new Date();
      const dateto = new Date(datefrom);
      datefrom.setHours(0, 0, 0, 0);
      dateto.setDate(dateto.getDate() + 1);
      const data = await this.controlService.checkErrors(
        datefrom.toISOString(),
        dateto.toISOString(),
      );
      if (!data || data.length === 0) {
        return null;
      }
      const processAnomalies = async (data, anomalyService) => {
        const anomalyPromises = data
          .filter((item) => item?.veId)
          .map(async (item) => {
            const anomalyData = {
              veId: item.veId,
              date: item.sessions?.[0]?.date ?? null,
              gps: item.sessions?.[0]?.anomalies?.GPS ?? null,
              antenna: item.sessions?.[0]?.anomalies?.Antenna ?? null,
              detection_quality:
                item.sessions?.[0]?.anomalies?.detection_quality ?? null,
              session:
                item.anomaliaSessione ??
                item.sessions?.[0]?.anomalies?.open ??
                null,
            };
            if (
              anomalyData.session?.includes('nulla') &&
              item.sessions.length === 0
            ) {
              anomalyData.antenna = item.anomaliaSessione;
              anomalyData.gps = item.anomaliaSessione;
            }
            return anomalyService.createAnomaly(
              anomalyData.veId,
              anomalyData.date,
              anomalyData.gps,
              anomalyData.antenna,
              anomalyData.detection_quality,
              anomalyData.session,
            );
          });

        return Promise.all(anomalyPromises);
      };

      await processAnomalies(data, this.anomalyService);

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

  //@Cron('02 5 * * *')
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
