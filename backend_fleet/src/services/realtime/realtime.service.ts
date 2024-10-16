import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RealtimePosition } from 'entities/realtime_position.entity';
import { parseStringPromise } from 'xml2js';
import { createHash } from 'crypto';

@Injectable()
export class RealtimeService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(RealtimePosition)
    private readonly realtimeRepository: Repository<RealtimePosition>,
  ) {}

  // Prepara la richiesta SOAP
  private buildSoapRequest(methodName, id) {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fwan="http://www.fleetcontrol/FWAN/">
          <soapenv:Header/>
          <soapenv:Body>
              <fwan:${methodName}>
              <suId>${process.env.SUID}</suId>
              <vgId>${id}</vgId>
              <rowNumber>0</rowNumber>
              <timezone>Europe/Rome</timezone>
              <degreeCoords>true</degreeCoords>
              </fwan:${methodName}>
          </soapenv:Body>
      </soapenv:Envelope>`;
  }

  async getRealTimeList(id: number): Promise<any> {
    const methodName = 'realTimePositions';
    const requestXml = this.buildSoapRequest(methodName, id);
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
          const dataToHash = `${inside['rowNumber']}${inside['timestamp']}${inside['status']}${inside['latitude']}${inside['longitude']}${inside['navMode']}${inside['speed']}${inside['direction']}${item['veId']}`;
          const hash = createHash('sha256').update(dataToHash).digest('hex');
          return {
            row_number: inside['rowNumber'],
            timestamp:
              typeof inside['timestamp'] === 'object'
                ? null
                : inside['timestamp'],
            status: inside['status'],
            latitude: inside['latitude'],
            longitude: inside['longitude'],
            nav_mode: inside['navMode'],
            speed: inside['speed'],
            direction: inside['direction'],
            veId: item['veId'],
            hash: hash,
          };
        });
      });

      const newTimes = [];
      for (const realtime of filteredData) {
        const exists = await this.realtimeRepository.findOne({
          where: { hash: realtime.hash },
        });
        if (!exists) {
          const newTime = this.realtimeRepository.create({
            row_number: realtime.row_number,
            timestamp: realtime.timestamp,
            status: realtime.status,
            latitude: realtime.latitude,
            longitude: realtime.longitude,
            nav_mode: realtime.nav_mode,
            speed: realtime.speed,
            direction: realtime.direction,
            vehicle: realtime.veId,
            hash: realtime.hash,
          });
          newTimes.push(newTime);
        }
      }
      if (newTimes.length > 0) {
        await this.realtimeRepository.save(newTimes);
      }
      return newTimes;
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }

  async getAllTimes(): Promise<any> {
    const times = await this.realtimeRepository.find({
      relations: {
        vehicle: true,
      },
    });
    return times;
  }
  // non va
  async getTimesByVeId(id: number): Promise<any> {
    const times = await this.realtimeRepository.find({
      relations: {
        vehicle: true,
      },
      where: { vehicle: { veId: id } },
    });
    return times;
  }
}
