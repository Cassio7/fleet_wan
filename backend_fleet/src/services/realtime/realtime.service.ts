import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { RealtimePositionEntity } from 'classes/entities/realtime_position.entity';
import { parseStringPromise } from 'xml2js';
import { createHash } from 'crypto';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { convertHours } from 'src/utils/hoursFix';

@Injectable()
export class RealtimeService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(RealtimePositionEntity, 'mainConnection')
    private readonly realtimeRepository: Repository<RealtimePositionEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
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
          const dataToHash = `${inside['rowNumber']}${inside['timestamp']}${inside['status']}${inside['latitude']}${inside['longitude']}${inside['navMode']}${inside['speed']}${inside['direction']}${item['veId']}`;
          const hash = createHash('sha256').update(dataToHash).digest('hex');
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
            hash: hash,
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

      const newTimes = [];
      for (const realtime of filteredData) {
        const vehiclequery = vehiclequeryMap.get(Number(realtime.veId));
        const newTime = await queryRunner.manager
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
            hash: realtime.hash,
          });
        newTimes.push(newTime);
      }
      if (newTimes.length > 0) {
        await queryRunner.manager
          .getRepository(RealtimePositionEntity)
          .save(newTimes);
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return newTimes;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
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
   * Ritorna tutti i realtimes in base al id inserito
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
}
