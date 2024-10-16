import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { createHash } from 'crypto';
import { timestamp } from 'rxjs';

@Injectable()
export class HistoryService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

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
    try {
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
      const filteredDataVehicles = lists.map((item: any) => {
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
      return filteredDataVehicles;
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
}
