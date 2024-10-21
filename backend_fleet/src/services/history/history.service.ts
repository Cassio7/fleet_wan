import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { HistoryEntity } from 'classes/entities/history.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import { query } from 'express';
import { DataSource, Repository } from 'typeorm';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class HistoryService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(HistoryEntity, 'mainConnection')
    private readonly historyRepository: Repository<HistoryEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}
  // Costruisce la richiesta SOAP
  private buildSoapRequest(
    methodName: string,
    id: number,
    dateFrom: string,
    dateTo: string,
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fwan="http://www.fleetcontrol/FWAN/">
        <soapenv:Header/>
        <soapenv:Body>
          <fwan:${methodName}>
            <suId>${process.env.SUID}</suId>
            <veId>${id}</veId>
            <timezone>Europe/Rome</timezone>
            <degreeCoords>true</degreeCoords>
            <dateFrom>${dateFrom}</dateFrom>
            <dateTo>${dateTo}</dateTo>
          </fwan:${methodName}>
        </soapenv:Body>
      </soapenv:Envelope>`;
  }

  async getHistoryList(
    id: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<any> {
    const methodName = 'History';
    const requestXml = this.buildSoapRequest(methodName, id, dateFrom, dateTo);
    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${methodName}"`,
    };
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const response = await axios.post(this.serviceUrl, requestXml, {
        headers,
      });
      const jsonResult = await parseStringPromise(response.data, {
        explicitArray: false,
      });
      // Estrarre i dati necessari dall'oggetto JSON risultante
      const lists =
        jsonResult['soapenv:Envelope']['soapenv:Body']['historyResponse'][
          'list'
        ];
      if (!lists) {
        return false; // se item.list non esiste, salto elemento
      }
      const filteredDataHistory = lists.map((item: any) => {
        const dataToHash = `${item['timestamp']}${item['status']}${item['latitude']}${item['longitude']}${item['navMode']}${item['speed']}${item['direction']}${item['totalDistance']}${item['totalConsumption']}${item['fuelLevel']}${item['brushes']}${id}`;
        const hash = createHash('sha256').update(dataToHash).digest('hex');
        return {
          timestamp:
            typeof item['timestamp'] === 'object' ? null : item['timestamp'],
          status: item['status'],
          latitude: item['latitude'],
          longitude: item['longitude'],
          nav_mode: item['navMode'],
          speed: item['speed'],
          direction: item['direction'],
          tot_distance: item['totalDistance'],
          tot_consumption: item['totalConsumption'],
          fuel: item['fuelLevel'],
          brushes: item['brushes'],
          veId: id,
          hash: hash,
        };
      });
      const vehiclequery = await queryRunner.manager
        .getRepository(VehicleEntity)
        .findOne({
          where: { veId: id },
        });
      const newHistory = [];
      for (const history of filteredDataHistory) {
        const exists = await this.historyRepository.findOne({
          where: { hash: history.hash },
        });
        if (!exists) {
          const newHistoryOne = await queryRunner.manager
            .getRepository(HistoryEntity)
            .create({
              timestamp: history.timestamp,
              status: history.status,
              latitude: history.latitude,
              longitude: history.longitude,
              nav_mode: history.nav_mode,
              speed: history.speed,
              direction: history.direction,
              tot_distance: history.tot_distance,
              tot_consumption: history.tot_consumption,
              fuel: history.fuel,
              brushes: history.brushes,
              vehicle: vehiclequery,
              hash: history.hash,
            });
          newHistory.push(newHistoryOne);
        }
      }
      if (newHistory.length > 0) {
        await queryRunner.manager.getRepository(HistoryEntity).save(newHistory);
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return filteredDataHistory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
}
