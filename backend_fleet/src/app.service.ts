import {
  Injectable,
  OnModuleInit
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CompanyFactoryService } from './factory/company.factory';
import { GroupFactoryService } from './factory/group.factory';
import { UserFactoryService } from './factory/user.factory';
import { WorksiteFactoryService } from './factory/worksite.factory';
import { CompanyService } from './services/company/company.service';
import { SessionService } from './services/session/session.service';
import { TagService } from './services/tag/tag.service';
import { VehicleService } from './services/vehicle/vehicle.service';

import { AssociationFactoryService } from './factory/association.factory';
import { ServiceFactoryService } from './factory/service.factory';
import { AnomalyService } from './services/anomaly/anomaly.service';
import { getDaysInRange } from './utils/utils';

import { InjectRedis } from '@nestjs-modules/ioredis';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import Redis from 'ioredis';
import { EquipmentFacotoryService } from './factory/equipment.factory';
import { RentalFactoryService } from './factory/rental.factory';
import { WorkzoneFacotoryService } from './factory/workzone.factory';
import { StatsService } from './services/anomaly/stats/stats.service';
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
    private readonly associationFactoryService: AssociationFactoryService,
    private readonly serviceFactoryService: ServiceFactoryService,
    private readonly rentalFactoryService: RentalFactoryService,
    private readonly equipmentFacotoryService: EquipmentFacotoryService,
    private readonly workzoneFacotoryService: WorkzoneFacotoryService,
    private readonly anomalyService: AnomalyService,
    private readonly controlService: ControlService,
    private readonly statsService: StatsService,
    private readonly associationService: AssociationService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // popolo database all'avvio
  async onModuleInit(): Promise<void> {
    // const startDate = '2025-04-04T00:00:00.000Z';
    // //const endDate = '2025-01-01T00:00:00.000Z';
    // const endDate = new Date(
    //   new Date().getTime() + 2 * 60 * 60 * 1000,
    // ).toISOString();
    //await this.putDefaultData();
    //await this.putDbDataMix(startDate, endDate); // da usare nuovo
    //await this.setAssociations();
    //await this.putDbDataCronOne();
    //await this.anomalyCheck(startDate, endDate);
    //await this.dailyAnomalyCheck();
    //await this.setAnomaly();
    //await this.setStats();
  }

  async putDefaultData(): Promise<void> {
    //await this.redis.flushdb();
    await this.userFactoryService.createDefaultRoles();
    await this.userFactoryService.createDefaultUser();
    await this.companyFactoryService.createDefaultCompanies();
    await this.groupFactoryService.createDefaultGroup();
    await this.worksiteFactoryService.createDefaultWorksite();
    await this.associationFactoryService.createDefaultAssociation();
    await this.serviceFactoryService.createDefaultService();
    await this.rentalFactoryService.createDefaultRental();
    await this.equipmentFacotoryService.createDefaultEquipment();
    await this.workzoneFacotoryService.createDefaultWorkzone();
  }

  /**
   * PIU LENTA MA NO DUPLICATI PER I TAG
   * Recupera tutti i dati dei veicoli, inserisce le sessioni in parallelo ma i tag giorno per giorno
   * @param start inizio
   * @param end fine
   */
  async putDbDataMix(start: string, end: string): Promise<void> {
    const startDate = start;
    const endDate = end;

    console.log('Data inizio: ' + startDate + ' Data fine: ' + endDate);
    const batchSize = 30;

    // Carica tutti i veicoli dalle varie aziende
    await this.vehicleService.getVehicleList(254, 313, true); //Gesenu principale
    //await this.vehicleService.getVehicleList(254, 683); //Gesenu dismessi
    await this.vehicleService.getVehicleList(305, 650, true); //TSA principale
    await this.vehicleService.getVehicleList(324, 688, true); //Fiumicino principale
    await this.vehicleService.getVehicleList(336, 688, true); //GSA principale

    const dateFrom_new = new Date(startDate);
    const dateTo_new = new Date(endDate);
    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new); // Funzione che restituisce un array di giorni

    // da commentare dopo primo run
    //await this.worksiteFactoryService.createDefaultVehicleWorksite();

    const vehicles = await this.vehicleService.getActiveVehicles();

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
        console.log('tags');
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
   * Inserisce tutti i veicoli in parallelo in batch, ma i tag sequenzialmente
   */
  @Cron('*/10 * * * *', { name: 'putDbDataCronOne' })
  async putDbDataCronOne(): Promise<void> {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startDate = now.toISOString();
    // 2 ore e 3 minuti
    const endDate = new Date(
      new Date().getTime() + 2 * 60 * 60 * 1000,
    ).toISOString();
    console.log('Data inizio: ' + startDate + ' Data fine: ' + endDate);
    await this.vehicleService.getVehicleList(254, 313, false); //Gesenu principale
    await this.vehicleService.getVehicleList(305, 650, false); //TSA principale
    await this.vehicleService.getVehicleList(324, 688, false); //Fiumicino principale
    await this.vehicleService.getVehicleList(336, 688, true); //GSA principale

    const vehicles = await this.vehicleService.getActiveVehicles();

    // Creazione della mappa delle compagnie
    const companyMap = new Map();
    for (const vehicle of vehicles) {
      const company = await this.companyService.getCompanyByVeId(vehicle.veId);
      if (company) {
        companyMap.set(vehicle.veId, company);
      }
    }
    const vehiclesRFID = vehicles.filter((v) => v.allestimento);

    const batchSize = 50; // Dimensione del batch

    // Funzione per processare i veicoli in batch
    const processBatch = async (vehicles: VehicleEntity[]): Promise<void> => {
      for (let i = 0; i < vehicles.length; i += batchSize) {
        const batch = vehicles.slice(i, i + batchSize); // Prendi un sottoinsieme di 50 veicoli

        const vehicleRequests = batch.map((vehicle) => {
          console.log(
            `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
          );

          const company = companyMap.get(vehicle.veId);
          if (company) {
            return this.sessionService.getSessionist(
              company.suId,
              vehicle.veId,
              startDate,
              endDate,
            );
          }
        });

        await Promise.all(vehicleRequests); // Aspetta che il batch corrente termini prima di passare al prossimo
      }
    };

    // Esegui la funzione con il tuo array di veicoli
    await processBatch(vehicles);

    // Invece di elaborare tutti i veicoli in parallelo con Promise.all
    for (const vehicle of vehiclesRFID.filter((vehicle) =>
      companyMap.has(vehicle.veId),
    )) {
      console.log(
        `Tag ${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );

      const company = companyMap.get(vehicle.veId);

      if (vehicle.allestimento) {
        await this.tagService.putTagHistory(
          company.suId,
          vehicle.veId,
          startDate,
          endDate,
        );
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

  async anomalyCheck(start: string, end: string): Promise<void> {
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
          datefrom.toISOString(),
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

  @Cron('5 */5 * * *', { name: 'dailyAnomalyCheckCron' }) // ogni 5 ore e 5 minuti
  async dailyAnomalyCheckCron() {
    await this.dailyAnomalyCheck();
  }

  @Cron('59 23 * * *', { name: 'dailyAnomalyCheck' }) // prima di finire la giornata
  async dailyAnomalyCheck(): Promise<void> {
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
  @Cron('8 */5 * * *', { name: 'setAnomaly' })
  async setAnomaly(): Promise<void> {
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

  /**
   * Imposta le statische di ogni veicolo
   */
  @Cron('9 2 * * *', { name: 'setStats' })
  async setStats() {
    await this.statsService.setAllStatsRedis();
  }

  /**
   * Imposta le associazioni su redis
   */
  async setAssociations() {
    await this.associationService.setVehiclesAssociateAllUsersRedis();
    await this.associationService.setVehiclesAssociateAllUsersRedisSet();
  }
}
