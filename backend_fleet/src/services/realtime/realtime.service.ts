import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { RealtimeDTO } from 'classes/dtos/realtime.dto';
import { VehicleDTO } from 'classes/dtos/vehicle.dto';
import { RealtimePositionEntity } from 'classes/entities/realtime_position.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { convertHours } from 'src/utils/utils';
import { DataSource, In, Repository } from 'typeorm';
import { parseStringPromise } from 'xml2js';

import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class RealtimeService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(RealtimePositionEntity, 'readOnlyConnection')
    private readonly realtimeRepository: Repository<RealtimePositionEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    @InjectRedis() private readonly redis: Redis,
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

  async setRealtime(suId: number, vgId: number): Promise<any> {
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
   * Ritorna tutti i realtimes in base al VeId inserito
   * @param id VeId identificatico del veicolo
   * @returns Raggruppa i realtime per veicolo usando i DTO
   */
  async getTimesByVeId(id: number[]): Promise<any> {
    const times = await this.realtimeRepository.find({
      relations: {
        vehicle: true,
      },
      where: { vehicle: { veId: In(id) } },
    });
    // Creo DTO e formatto un output corretto
    return times.reduce(
      (acc, time) => {
        // Trova l'indice del veicolo esistente o crea un nuovo gruppo
        let vehicleGroup = acc.find(
          (group) => group.vehicle.veId === time.vehicle.veId,
        );

        if (!vehicleGroup) {
          const vehicleDTO = new VehicleDTO();
          vehicleDTO.plate = time.vehicle.plate;
          vehicleDTO.veId = time.vehicle.veId;

          vehicleGroup = {
            vehicle: vehicleDTO,
            realtime: [],
          };
          acc.push(vehicleGroup);
        }

        const realtimeDTO = new RealtimeDTO();
        realtimeDTO.timestamp = time.timestamp;
        realtimeDTO.row_number = time.row_number;
        realtimeDTO.status = time.status;
        realtimeDTO.latitude = time.latitude;
        realtimeDTO.longitude = time.longitude;
        realtimeDTO.nav_mode = time.nav_mode;
        realtimeDTO.speed = time.speed;
        realtimeDTO.direction = time.direction;
        vehicleGroup.realtime.push(realtimeDTO);

        return acc;
      },
      [] as Array<{ vehicle: VehicleDTO; realtime: RealtimeDTO[] }>,
    );
  }

  /**
   * Pulisco la tabella dai vecchi dati salvati
   */
  async clearRealtime() {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      await queryRunner.manager.getRepository(RealtimePositionEntity).clear();
      // fa ripartire gli id da 1
      await queryRunner.query(
        'ALTER SEQUENCE realtime_positions_id_seq RESTART WITH 1',
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nella pulizia della tabella: ', error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Filtra soltanto la posizione più recente senza lat e long = 0
   * @param realtimes Oggetto contenente tutte i veicoli e le relative posizioni
   * @returns
   */
  async calculateLastValid(realtimes: any) {
    const latestRealtimes = realtimes.map((group) => {
      // Trova il primo realtime valido partendo dal più grande (già ordinato per timestamp)
      for (const realtime of group.realtime) {
        if (realtime.latitude !== 0 && realtime.longitude !== 0) {
          return {
            vehicle: group.vehicle,
            realtime: realtime,
          };
        }
      }
      // Se nessun realtime ha coordinate valide, prendo il primo
      return {
        vehicle: group.vehicle,
        realtime: group.realtime[0],
      };
    });
    return latestRealtimes;
  }

  /**
   * Imposta i realtime sulla cache di redis per recupero veloce
   * @param realtimes
   */
  async setLastValidRedis(realtimes: any) {
    for (const realtime of realtimes) {
      const key = `realtime:${realtime.vehicle.veId}`;
      await this.redis.set(key, JSON.stringify(realtime));
    }
  }
}
