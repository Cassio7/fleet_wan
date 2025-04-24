import { TagService } from './../tag/tag.service';
import { CompanyService } from './../company/company.service';
import { AnomalyService } from './../anomaly/anomaly.service';
import { ControlService } from 'src/services/control/control.service';
import { Injectable } from '@nestjs/common';
import { VehicleService } from '../vehicle/vehicle.service';
import { SessionService } from '../session/session.service';
import { getDaysInRange } from 'src/utils/utils';

@Injectable()
export class RefresherService {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly companyService: CompanyService,
    private readonly sessionService: SessionService,
    private readonly tagService: TagService,
    private readonly controlService: ControlService,
    private readonly anomalyService: AnomalyService,
  ) {}

  /**
   * Funzione per recupero e calcolo delle anomalie in base ad un range e veid passati
   * @param veId identificativo veicolo
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   */
  async refreshVehicleAnomaly(
    veId: number[],
    dateFrom: Date,
    dateTo: Date,
  ): Promise<void> {
    try {
      const vehicles = await this.vehicleService.getVehiclesByVeId(veId);
      const companyMap = new Map();
      const companyPromises = vehicles.map(async (vehicle) => {
        const company = await this.companyService.getCompanyByVeId(
          vehicle.veId,
        );
        if (company) {
          companyMap.set(vehicle.veId, company);
        }
      });
      await Promise.all(companyPromises);
      // Elabora ogni veicolo uno alla volta
      const daysInRange = getDaysInRange(dateFrom, dateTo); // Funzione che restituisce un array di giorni
      const batchSize = 10;
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
      for (let i = 0; i < daysInRange.length; i++) {
        const day = daysInRange[i];
        const datefrom = day;
        const dateto = new Date(datefrom);
        dateto.setDate(dateto.getDate() + 1);

        const data = await this.controlService.checkErrors(
          datefrom.toISOString(),
          dateto.toISOString(),
          veId,
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
    } catch (error) {
      console.log(error);
    }
  }
}
