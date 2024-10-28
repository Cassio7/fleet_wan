import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import axios from 'axios';
import { DataSource } from 'typeorm';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class TagService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';
  constructor(
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
  async putTagHistory(
    id: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<any> {
    const methodName = 'TagHistory';
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
      if (!jsonResult) {
        console.log('vuoto jsonResult');
      }
      const lists =
        jsonResult['soapenv:Envelope']['soapenv:Body']['tagHistoryResponse'][
          'list'
        ];
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return lists;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
}
