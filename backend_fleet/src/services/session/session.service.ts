import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { HistoryEntity } from 'classes/entities/history.entity';
import { SessionEntity } from 'classes/entities/session.entity';
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
    @InjectRepository(SessionEntity, 'mainConnection')
    private readonly sessionRepository: Repository<SessionEntity>,
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
    const methodName = 'Session';
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

      const lists =
        jsonResult['soapenv:Envelope']['soapenv:Body'][
          'sessionHistoryResponse'
        ]['list'];
      if (!lists) {
        return false;
      }
      const filteredDataSession = lists.map((item: any) => {
        const dataToHash = `${item['periodFrom']}${item['periodTo']}${item['sequenceId']}${item['closed']}${item['distance']}${item['engineDriveSec']}${item['engineNoDriveSec']}`;
        const hash = createHash('sha256').update(dataToHash).digest('hex');
        return {
          period_from: item['periodFrom'],
          period_to: item['periodTo'],
          sequence_id: item['sequenceId'],
          closed: item['closed'],
          distance: item['distance'],
          engine_drive: item['engineDriveSec'],
          engine_stop: item['engineNoDriveSec'],
          hash: hash,
        };
      });
      const newSession = [];
      for (const session of filteredDataSession) {
        const exists = await this.sessionRepository.findOne({
          where: { hash: session.hash },
        });
        if (!exists) {
          const newSessionOne = await queryRunner.manager
            .getRepository(SessionEntity)
            .create({
              // DA FINIRE
            });
        }
      }
      //await this.setHistory(id, lists);
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return filteredDataSession;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
  private async setHistory(id, lists) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // Estrarre i dati necessari dall'oggetto JSON risultante

      if (!lists) {
        return false; // se item.list non esiste, salto elemento
      }
      const filteredDataHistory = lists.flatMap((item: any) => {
        if (!item.list) {
          return []; // se item.list non esiste, salto elemento
        }
        return item.list.map((inside: any) => {
          const dataToHash = `${inside['timestamp']}${inside['status']}${inside['latitude']}${inside['longitude']}${inside['navMode']}${inside['speed']}${inside['direction']}${inside['totalDistance']}${inside['totalConsumption']}${inside['fuelLevel']}${inside['brushes']}${id}`;
          const hash = createHash('sha256').update(dataToHash).digest('hex');
          return {
            timestamp:
              typeof inside['timestamp'] === 'object'
                ? null
                : item['timestamp'],
            status: inside['status'],
            latitude: inside['latitude'],
            longitude: inside['longitude'],
            nav_mode: inside['navMode'],
            speed: inside['speed'],
            direction: inside['direction'],
            tot_distance: inside['totalDistance'],
            tot_consumption: inside['totalConsumption'],
            fuel: inside['fuelLevel'],
            brushes: inside['brushes'],
            veId: id,
            hash: hash,
          };
        });
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
      return newHistory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
}
