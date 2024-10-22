import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { HistoryEntity } from 'classes/entities/history.entity';
import { SessionEntity } from 'classes/entities/session.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import {
  DataSource,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class SessionService {
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
  /**
   * Permette l'inserimento nel database di tutte le sessioni ed i relativi history presenti dato un range temporale.
   * Una sessione viene stabilita dal momento in cui un mezzo si accende fin quando non viene spento.
   * Il WSDL ritorna un max di 5000 righe
   *
   * @param id - VeId identificativo Veicolo
   * @param dateFrom - Data inizio ricerca sessione
   * @param dateTo - Data fine ricerca sessione
   * @returns
   */
  async getSessionist(
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
          distance: item['distance'].split('.').join(''),
          engine_drive: item['engineDriveSec'],
          engine_stop: item['engineNoDriveSec'],
          lists: item['list'],
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
              period_from: session.period_from,
              period_to: session.period_to,
              sequence_id: session.sequence_id,
              closed: session.closed,
              distance: session.distance,
              engine_drive: session.engine_drive,
              engine_stop: session.engine_stop,
              hash: session.hash,
            });
          newSession.push(newSessionOne);
        }
      }
      if (newSession.length > 0) {
        await queryRunner.manager.getRepository(SessionEntity).save(newSession);
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();

      // creo array contenente l'oggetto SessionEnity necessario per relazione database e la lista di history relativa ad esso
      const sessionArray = [];
      for (const session of filteredDataSession) {
        const sessionquery = await this.getSessionByHash(session.hash);
        if (sessionquery) {
          sessionArray.push({
            sessionquery: sessionquery,
            sessionLists: session.lists,
          });
        }
      }
      await this.setHistory(id, sessionArray);
      return sessionArray;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
  /**
   * Inserisce tutti gli history presenti associati ad una determinata sessione
   * @param id
   * @param sessionArray
   * @returns
   */
  private async setHistory(id, sessionArray) {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // Estrarre i dati necessari dall'oggetto JSON risultante

      if (!sessionArray) {
        return false; // se item.list non esiste, salto elemento
      }
      for (const historysession of sessionArray) {
        const filteredDataHistory = historysession.sessionLists.map(
          (item: any) => {
            const dataToHash = `${item['timestamp']}${item['status']}${item['latitude']}${item['longitude']}${item['navMode']}${item['speed']}${item['direction']}${item['totalDistance']}${item['totalConsumption']}${item['fuelLevel']}${item['brushes']}${id}`;
            const hash = createHash('sha256').update(dataToHash).digest('hex');
            return {
              timestamp:
                typeof item['timestamp'] === 'object'
                  ? null
                  : item['timestamp'],
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
          },
        );
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
                session: historysession.sessionquery,
                hash: history.hash,
              });
            newHistory.push(newHistoryOne);
          }
        }
        if (newHistory.length > 0) {
          await queryRunner.manager
            .getRepository(HistoryEntity)
            .save(newHistory);
        }
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
  /**
   * Ricerca sessione tramite l'hash
   * @param hash hash della sessione generato in getSessionist
   * @returns
   */
  private async getSessionByHash(hash): Promise<any> {
    const session = await this.sessionRepository.findOne({
      where: { hash: hash },
    });
    return session;
  }
  /**
   * Ritorna la lista completa delle sessione in base all'id del veicolo
   * @param id VeId identificativo Veicolo
   * @returns
   */
  async getAllSessionByVeId(id: number): Promise<any> {
    const session = await this.sessionRepository.find({
      where: { history: { vehicle: { veId: id } } },
      relations: {
        history: true,
      },
    });
    return session;
  }
  /**
   * Restituisce le sessione in base all'id del veicolo e al range temporale inserito
   * @param id VeId identificativo Veicolo
   * @param dateFrom Data inizio ricerca sessione
   * @param dateTo Data fine ricerca sessione
   * @returns
   */
  async getAllSessionByVeIdRanged(
    id: number,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any> {
    const session = await this.sessionRepository.find({
      where: {
        history: { vehicle: { veId: id } },
        period_from: MoreThanOrEqual(dateFrom),
        period_to: LessThanOrEqual(dateTo),
      },
      relations: {
        history: true,
      },
    });
    return session;
  }
}
