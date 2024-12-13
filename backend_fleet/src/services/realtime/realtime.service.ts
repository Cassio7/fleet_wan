import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { DataSource, Repository, In } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { RealtimePositionEntity } from 'classes/entities/realtime_position.entity';
import { parseStringPromise } from 'xml2js';
import { createHash } from 'crypto';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { convertHours } from 'src/utils/utils';

@Injectable()
export class RealtimeService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(RealtimePositionEntity, 'readOnlyConnection')
    private readonly realtimeRepository: Repository<RealtimePositionEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  // Prepara la richiesta SOAP
  private buildSoapRequest(methodName, suId, vgId) {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fwan="http://www.fleetcontrol/FWAN/">
          <soapenv:Header/>
          <soapenv:Body>
              <fwan:${methodName}>
              <suId>${suId}</suId>
              <vgId>${vgId}</vgId>
              <rowNumber>0</rowNumber>
              <timezone>Europe/Rome</timezone>
              <degreeCoords>true</degreeCoords>
              </fwan:${methodName}>
          </soapenv:Body>
      </soapenv:Envelope>`;
  }

  async getRealTimeList(suId: number, vgId: number): Promise<any> {
    const methodName = 'realTimePositions';
    const requestXml = this.buildSoapRequest(methodName, suId, vgId);
    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${methodName}"`,
    };
    let response;
    let retries = 3;
    while (retries > 0) {
      try {
        response = await axios.post(this.serviceUrl, requestXml, {
          headers,
        });
        break;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.warn(
            `Errore ricevuto. Ritento (${3 - retries + 1}/3)...`,
            error.message,
          );
          retries -= 1;

          // Delay di 1 secondo tra i tentativi
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        console.error(
          'Tutti i tentativi di connessione sono falliti, saltato controllo:',
          error.message,
        );
      }
    }
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(RealtimePositionEntity).clear();
      const response = await axios.post(this.serviceUrl, requestXml, {
        headers,
      });
      const jsonResult = await parseStringPromise(response.data, {
        explicitArray: false,
      });

      const lists =
        jsonResult['soapenv:Envelope']['soapenv:Body'][
          'realTimePositionsResponse'
        ]['list'];

      // flatMap permette di appiattire il risultato interno per evitare doppio [[]]
      const filteredData = lists.flatMap((item: any) => {
        if (!item.list) {
          return []; // se item.list non esiste, salto elemento
        }
        return item.list.map((inside: any) => {
          return {
            row_number: inside['rowNumber'],
            timestamp:
              typeof inside['timestamp'] === 'object'
                ? null
                : convertHours(inside['timestamp']),
            status: inside['status'],
            latitude: inside['latitude'],
            longitude: inside['longitude'],
            nav_mode: inside['navMode'],
            speed: inside['speed'],
            direction: inside['direction'],
            veId: item['veId'],
          };
        });
      });
      const vehiclequery_list = await queryRunner.manager
        .getRepository(VehicleEntity)
        .find();
      const vehiclequeryMap = new Map(
        vehiclequery_list.map((vehiclequery) => [
          vehiclequery.veId,
          vehiclequery,
        ]),
      );
      const newTimes = (
        await Promise.all(
          filteredData.map(async (realtime) => {
            const vehiclequery = vehiclequeryMap.get(Number(realtime.veId));
            if (vehiclequery) {
              return queryRunner.manager
                .getRepository(RealtimePositionEntity)
                .create({
                  row_number: realtime.row_number,
                  timestamp: realtime.timestamp,
                  status: realtime.status,
                  latitude: realtime.latitude,
                  longitude: realtime.longitude,
                  nav_mode: realtime.nav_mode,
                  speed: realtime.speed,
                  direction: realtime.direction,
                  vehicle: vehiclequery,
                });
            }
          }),
        )
      ).filter((entry) => entry !== undefined);
      // DATI SALVATI SINGOLARMENTE PER ESCLUDERE ERRORI DI GRANDEZZA QUERY
      const batchSize = 600; // Dimensione del blocco
      for (let i = 0; i < newTimes.length; i += batchSize) {
        const batch = newTimes.slice(i, i + batchSize);
        await queryRunner.manager
          .getRepository(RealtimePositionEntity)
          .save(batch);
      }
      // for (const item of newTimes) {
      //   await queryRunner.manager
      //     .getRepository(RealtimePositionEntity)
      //     .save(item);
      // }
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return newTimes;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
    }
  }
  /**
   * Ritorna tutti i realtimes di tutti i veicoli
   * @returns
   */
  async getAllTimes(): Promise<any> {
    const times = await this.realtimeRepository.find({
      relations: {
        vehicle: true,
      },
    });
    return times;
  }

  /**
   * Ritorna tutti i realtimes in base al VeId inserito
   * @param id VeId identificatico del veicolo
   * @returns
   */
  async getTimesByVeId(id: number): Promise<any> {
    const times = await this.realtimeRepository.find({
      relations: {
        vehicle: true,
      },
      where: { vehicle: { veId: id } },
    });
    return times;
  }

  /**
   * Ritorna tutti i realtimes in base ai VeId
   * @param id array di VeId
   * @returns
   */
  async getLastByVeId(id: number[]): Promise<any> {
    const times = await this.realtimeRepository.find({
      relations: {
        vehicle: true,
      },
      where: { vehicle: { veId: In(id) } },
    });
    return times;
  }
}
