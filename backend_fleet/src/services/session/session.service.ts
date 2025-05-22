import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { createHash } from 'crypto';
import { getDistance } from 'geolib';
import Redis from 'ioredis';
import { HistoryDTO } from 'src/classes/dtos/history.dto';
import { SessionDTO } from 'src/classes/dtos/session.dto';
import { HistoryEntity } from 'src/classes/entities/history.entity';
import { SessionEntity } from 'src/classes/entities/session.entity';
import { VehicleEntity } from 'src/classes/entities/vehicle.entity';
import { getDaysInRange, sameDay } from 'src/utils/utils';
import {
  DataSource,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { AssociationService } from '../association/association.service';
import { VehicleRangeKm } from '@interfaces2/VehicleRangeKm.interface';
import { DriveStopTime } from '@interfaces2/DriveStopTime.interface';

@Injectable()
export class SessionService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  // imposta il tempo di recupero dei history, ogni quanti secondi = 3 min
  private SPAN_POSIZIONI = this.configService.get<number>('SPAN_POSIZIONI');

  constructor(
    private configService: ConfigService,
    @InjectRepository(SessionEntity, 'readOnlyConnection')
    private readonly sessionRepository: Repository<SessionEntity>,
    @InjectRepository(HistoryEntity, 'readOnlyConnection')
    private readonly historyRepository: Repository<HistoryEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    @InjectRedis() private readonly redis: Redis,
    private readonly associationService: AssociationService,
  ) {}

  // Costruisce la richiesta SOAP
  private buildSoapRequest(
    methodName: string,
    suId: number,
    veId: number,
    dateFrom: string,
    dateTo: string,
  ): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fwan="http://www.fleetcontrol/FWAN/">
        <soapenv:Header/>
        <soapenv:Body>
          <fwan:${methodName}>
            <suId>${suId}</suId>
            <veId>${veId}</veId>
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
   * @param suId - suId identificativo società
   * @param veId - VeId identificativo Veicolo
   * @param dateFrom - Data inizio ricerca sessione
   * @param dateTo - Data fine ricerca sessione
   * @param setRedis - se ho fatto la chiamata da cron, metto a true per impostare last session e last history
   * @returns
   */
  async getSessionist(
    suId: number,
    veId: number,
    dateFrom: string,
    dateTo: string,
    setRedis: boolean,
  ): Promise<any> {
    const methodName = 'Session';
    const requestXml = this.buildSoapRequest(
      methodName,
      suId,
      veId,
      dateFrom,
      dateTo,
    );
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
    let jsonResult;
    try {
      jsonResult = await parseStringPromise(response.data, {
        explicitArray: false,
      });
    } catch (parseError) {
      console.error('Errore nel parsing XML → JSON:', parseError);
      return false;
    }
    if (!jsonResult) return false;
    const lists =
      jsonResult['soapenv:Envelope']['soapenv:Body']['sessionHistoryResponse'][
        'list'
      ];
    if (!lists) return false;

    // evita di inserire un solo oggetto e non un array nel caso session.lists abbia soltanto 1 elemento, evita problemi del .map sotto
    const sessionLists = Array.isArray(lists) ? lists : [lists];

    const hashSession = (session: any): string => {
      const toHash = {
        periodFrom: session.periodFrom,
        periodTo: session.periodTo,
        sequenceId: session.sequenceId,
        closed: session.closed,
        distance: session.distance,
        engineDriveSec: session.engineDriveSec,
        engineNoDriveSec: session.engineNoDriveSec,
        veId: veId,
      };
      return createHash('sha256').update(JSON.stringify(toHash)).digest('hex');
    };

    const hashSession0 = (session: any): string => {
      const toHash = {
        periodFrom: session.periodFrom,
        sequenceId: session.sequenceId,
        closed: session.closed,
        distance: session.distance,
        engineDriveSec: session.engineDriveSec,
        engineNoDriveSec: session.engineNoDriveSec,
        veId: veId,
      };
      return createHash('sha256').update(JSON.stringify(toHash)).digest('hex');
    };
    const filteredDataSession = sessionLists
      .filter((item: any) => item?.list)
      .map((item: any) => {
        const hash =
          Number(item.sequenceId) === 0
            ? hashSession0(item)
            : hashSession(item);
        return {
          period_from: item.periodFrom,
          period_to: item.periodTo,
          sequence_id: item.sequenceId,
          closed: item.closed,
          distance: item.distance,
          engine_drive: item.engineDriveSec,
          engine_stop: item.engineNoDriveSec,
          lists: item.list,
          hash,
        };
      });
    const sessionSequenceId = filteredDataSession.map(
      (session) => session.sequence_id,
    );
    const newSession: SessionEntity[] = [];
    const updatedSession: Partial<SessionEntity>[] = [];
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Esegui una query per ottenere tutte le sessioni con hash corrispondenti
      const sessionQueries = await queryRunner.manager
        .getRepository(SessionEntity)
        .find({
          select: {
            sequence_id: true,
            hash: true,
            key: true,
            period_from: true,
          },
          where: {
            sequence_id: In(sessionSequenceId),
            history: { vehicle: { veId: veId } },
          },
        });

      // Crea una mappa che associa ciascun sequence_id a un array di sessioni
      const sessionQueryMap = new Map<number, SessionEntity[]>();
      for (const query of sessionQueries) {
        const seqId = Number(query.sequence_id);
        if (!sessionQueryMap.has(seqId)) {
          sessionQueryMap.set(seqId, []);
        }
        sessionQueryMap.get(seqId).push(query);
      }

      for (const session of filteredDataSession) {
        const seqId = Number(session.sequence_id);
        // Ottieni tutte le sessioni con questo sequence_id (o array vuoto se non esistono)
        const existingSessions = sessionQueryMap.get(seqId) || [];
        if (existingSessions.length === 0) {
          // Nessuna sessione esistente con questo sequence_id
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
        } else if (seqId === 0 && existingSessions.length != 0) {
          // Caso speciale per sequence_id = 0
          let hashFound = false;

          for (const exists of existingSessions) {
            // se ci sono piu sessioni aperte nello stesso giorno le elimino per averne soltanto 1
            if (
              sameDay(exists.period_from, new Date(session.period_from)) &&
              exists.hash !== session.hash
            ) {
              await queryRunner.manager
                .getRepository(SessionEntity)
                .delete({ key: exists.key });
            } else if (exists.hash === session.hash) {
              // Se troviamo una sessione con lo stesso hash, la aggiorniamo
              updatedSession.push({
                key: exists.key,
                period_from: session.period_from,
                period_to: session.period_to,
                sequence_id: session.sequence_id,
                closed: session.closed,
                distance: session.distance,
                engine_drive: session.engine_drive,
                engine_stop: session.engine_stop,
                hash: session.hash,
              });
              hashFound = true;
              break;
            }
          }

          if (!hashFound) {
            // Se non troviamo nessuna sessione con lo stesso hash, ne creiamo una nuova
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
        } else {
          // Per altre sequence_id, controlla l'hash
          for (const exists of existingSessions) {
            if (exists.hash !== session.hash) {
              updatedSession.push({
                key: exists.key,
                period_from: session.period_from,
                period_to: session.period_to,
                sequence_id: session.sequence_id,
                closed: session.closed,
                distance: session.distance,
                engine_drive: session.engine_drive,
                engine_stop: session.engine_stop,
                hash: session.hash,
              });
              break;
            }
          }
        }
      }
      // salvo nuove sessioni
      if (newSession.length > 0) {
        await queryRunner.manager.getRepository(SessionEntity).save(newSession);
      }
      // faccio update di sessioni
      if (updatedSession.length > 0) {
        for (const session of updatedSession) {
          console.log(`update Sessione con sequence_id ${session.sequence_id}`);
          await queryRunner.manager
            .getRepository(SessionEntity)
            .update({ key: session.key }, session);
        }
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nella richiesta SOAP:', error);
    } finally {
      await queryRunner.release();
    }

    // creo array contenente l'oggetto SessionEnity necessario per relazione database e la lista di history relativa ad esso
    const sessionArray: { sessionquery: SessionEntity; sessionLists: any }[] =
      [];
    // Recupero e passo al setHistory soltanto le sessioni nuove oppure quelle con update eseguito
    const sessionHashMap = new Map<string, any>();

    filteredDataSession.forEach((session) => {
      sessionHashMap.set(session.hash, session);
    });

    // salvo nuove sessioni e rispettive posizioni
    for (const session of newSession) {
      const exist = sessionHashMap.get(session.hash);
      if (!exist) continue;
      const sessionHistory = Array.isArray(exist.lists)
        ? exist.lists
        : [exist.lists];
      sessionArray.push({
        sessionquery: session,
        sessionLists: sessionHistory,
      });
    }
    // ricerco sessioni update tramite hash e aggrego rispettiva lista posizioni
    for (const session of updatedSession) {
      const sessionquery = await this.getSessionByHash(session.hash);
      if (!sessionquery) continue;
      const exist = sessionHashMap.get(session.hash);
      if (!exist) continue;

      // evita di inserire un solo oggetto e non un array nel caso session.lists abbia soltanto 1 elemento, evita problemi del .map sotto
      const sessionHistory = Array.isArray(exist.lists)
        ? exist.lists
        : [exist.lists];
      sessionArray.push({
        sessionquery: sessionquery,
        sessionLists: sessionHistory,
      });
    }

    // se sta a true allora voglio impostare su redis l'ultima sessione valida
    if (setRedis) {
      // la sessione con sequence_id maggiore viene inserita su redis, filtrando quelle a 0
      const lastSession = sessionArray
        .filter((item) => Number(item.sessionquery.sequence_id) !== 0)
        .reduce(
          (max, item) => {
            return !max ||
              Number(item.sessionquery.sequence_id) >
                Number(max.sessionquery.sequence_id)
              ? item
              : max;
          },
          null as (typeof sessionArray)[number] | null,
        );
      if (lastSession) {
        const key = `lastValidSession:${veId}`;
        const data = {
          key: lastSession.sessionquery.key,
          period_to: lastSession.sessionquery.period_to,
          veid: veId,
        };
        await this.redis.set(key, JSON.stringify(data));
      }
    }

    await this.setHistory(veId, sessionArray, setRedis);
    return sessionArray;
  }

  /**
   * Inserisce tutti gli history presenti associati ad una determinata sessione
   * @param veId VeId identificativo Veicolo
   * @param sessionArray
   * @param setRedis - se ho fatto la chiamata da cron, metto a true per impostare last session e last history
   * @returns
   */
  private async setHistory(
    veId: number,
    sessionArray: { sessionquery: SessionEntity; sessionLists: any }[],
    setRedis: boolean,
  ): Promise<boolean> {
    if (!sessionArray || sessionArray.length === 0) return false; // se item.list non esiste, salto elemento

    // nuovi posizioni salvate nel db
    let newHistoriesdb: HistoryEntity[] = [];
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Estrarre i dati necessari dall'oggetto JSON risultante
      const hashHistory = (history: any): string => {
        const toHash = {
          timestamp: history.timestamp,
          status: history.status,
          latitude: history.latitude,
          longitude: history.longitude,
          navMode: history.navMode,
          speed: history.speed,
          direction: history.direction,
          totalDistance: history.totalDistance,
          totalConsumption: history.totalConsumption,
          fuelLevel: history.fuelLevel,
          brushes: history.brushes,
          id: veId,
        };
        return createHash('sha256')
          .update(JSON.stringify(toHash))
          .digest('hex');
      };
      const newHistories: Partial<HistoryEntity>[] = [];

      for (const historysession of sessionArray) {
        // controllo nel caso ci sia soltanto 1 history per una sessione
        let lastSavedTimestamp: number | null = null;
        // faccio il reverse per prendere la più vecchia e poi la più recente
        const reversedSessionLists = historysession.sessionLists.reverse();

        const cleanedDataHistory = reversedSessionLists
          .filter((item) => item)
          .reduce((acc: any[], item: any) => {
            if (!item) {
              return []; // se item.list non esiste, salto elemento
            }
            const hash = hashHistory(item);
            // prendo timestamp corrente per confrontarlo con precedente, in modo da prendere intervalli temporali specifici
            const currentTimestamp =
              typeof item['timestamp'] === 'object' ? null : item['timestamp'];
            // lo modifico per eliminare errori di conversione
            const currentMillis = new Date(currentTimestamp).getTime();
            try {
              // controllo se è il primo elemento oppure se la differenza tra i due è maggiore di quanto specificato
              if (
                !lastSavedTimestamp ||
                Math.abs(currentMillis - lastSavedTimestamp) >=
                  this.SPAN_POSIZIONI ||
                currentMillis === lastSavedTimestamp
              ) {
                lastSavedTimestamp = currentMillis;
                acc.push({
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
                  veId: veId,
                  hash: hash,
                });
              }
            } catch (error) {
              console.log('errore nella if controllo temporale: ' + error);
            }
            return acc;
          }, []);

        const vehicleQuery = await queryRunner.manager
          .getRepository(VehicleEntity)
          .findOne({
            where: { veId: veId },
          });

        const historyHashes = cleanedDataHistory.map((history) => history.hash);

        // Esegui una query per ottenere tutte le posizioni con hash corrispondenti
        const existingHistories = await queryRunner.manager
          .getRepository(HistoryEntity)
          .find({
            where: { hash: In(historyHashes) },
          });
        // Crea una mappa per abbinare gli hash alle posizioni restituite dalla query
        const existingHistoryMap = new Map(
          existingHistories.map((history) => [history.hash, history]),
        );

        // salvo soltanto le history di cui non trovo hash e dove la lunghezza no 0
        const filteredHistories = cleanedDataHistory.filter(
          (history) =>
            history.length !== 0 && !existingHistoryMap.has(history.hash),
        );

        for (const history of filteredHistories) {
          const newHistory = queryRunner.manager
            .getRepository(HistoryEntity)
            .create({
              timestamp: history.timestamp,
              status: history.status,
              latitude: parseFloat(history.latitude),
              longitude: parseFloat(history.longitude),
              nav_mode: history.nav_mode,
              speed: parseFloat(history.speed),
              direction: parseFloat(history.direction),
              tot_distance: history.tot_distance,
              tot_consumption: history.tot_consumption,
              fuel: history.fuel,
              brushes: history.brushes,
              vehicle: vehicleQuery,
              session: historysession.sessionquery,
              hash: history.hash,
            });
          // le inserisco in un array per creazione massiva
          newHistories.push(newHistory);
        }
      }
      // salvo tutte le nuove posizioni
      if (newHistories.length > 0) {
        newHistoriesdb = await queryRunner.manager
          .getRepository(HistoryEntity)
          .save(newHistories);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nella richiesta SOAP:', error);
    } finally {
      await queryRunner.release();
    }

    // se non ho salvato nulla skip
    if (!newHistoriesdb || newHistoriesdb.length === 0) return false;
    try {
      if (setRedis) {
        // prendo la posizione con il timestamp maggiore, posizione più recente
        const lastHistory = newHistoriesdb.reduce((latest, current) => {
          return new Date(current.timestamp) > new Date(latest.timestamp)
            ? current
            : latest;
        });

        const data = {
          id: lastHistory.id,
          timestamp: lastHistory.timestamp,
          latitude: lastHistory.latitude,
          longitude: lastHistory.longitude,
          direction: lastHistory.direction,
          speed: lastHistory.speed,
          veid: veId,
        };
        // la salvo su redis
        const key = `lastHistory:${veId}`;
        await this.redis.set(key, JSON.stringify(data));
      }
    } catch (error) {
      console.error(
        `Errore durante il salvataggio su Redis per veId ${veId}:`,
        error,
      );
    }

    return true;
  }

  /**
   * Ricerca sessione tramite l'hash, solo dentro server
   * @param hash hash della sessione generato in getSessionist
   * @returns
   */
  private async getSessionByHash(hash): Promise<SessionEntity> {
    const session = await this.sessionRepository.findOne({
      where: { hash: hash },
    });
    return session;
  }

  /**
   * Recupera la sessione in base al key, prima controlla che l utente possa effettivamente accedere al veicolo
   * Solitamente viene chiamata dopo il recupero di redis per l ultima sessione di un veicolo
   * @param userId user id
   * @param sessionRedis oggetto che viene recuperato da redis
   * @returns ritorna SessionDTO
   */
  async getSessionByKey(
    userId: number,
    sessionRedis: any,
  ): Promise<SessionDTO> {
    await this.associationService.checkVehicleAssociateUserSet(
      userId,
      sessionRedis.veid,
    );
    try {
      const session = await this.sessionRepository.findOne({
        where: { key: sessionRedis.key },
        relations: {
          history: true,
        },
        order: {
          period_to: 'DESC',
        },
      });
      return session ? this.toDTOSession(session) : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle sessioni veId con range temporale`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera tutte le sessioni in base al veid passato
   * @param userId user id
   * @param veId veid del veicolo
   * @returns sessione DTO
   */
  async getAllSessionByVeId(
    userId: number,
    veId: number,
  ): Promise<SessionDTO[]> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    try {
      const sessions = await this.sessionRepository.find({
        where: { history: { vehicle: { veId: veId } } },
        relations: {
          history: true,
        },
        order: {
          period_to: 'DESC',
        },
      });
      return sessions.map((session) => this.toDTOSession(session));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle sessioni veId con range temporale`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera alcuni dati di tutte le sessioni e i relativi history di tutti i veicoli passati
   * in base ad un range temporale inserito, si utilizza soltanto internamente
   * @param vehicleIds lista di veId identificativi veicolo
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns ritorna una mappa con (veId, session[])
   */
  async getAllSessionsByVeIdsAndRange(
    vehicleIds: number[],
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Map<number, any[]>> {
    const query = `
      SELECT
        s.key,
        s.sequence_id,
        s.distance,
        h.latitude,
        h.longitude,
        v."veId"
      FROM session s
      INNER JOIN history h ON s.id = h."sessionId"
      INNER JOIN vehicles v ON h."vehicleId" = v.id
      WHERE v."veId" IN (${vehicleIds.map((_, index) => `$${index + 1}`).join(',')})
        AND s.period_from <= $${vehicleIds.length + 2}  -- dateTo
        AND s.period_to >= $${vehicleIds.length + 1}    -- dateFrom
      ORDER BY v."veId", s.sequence_id DESC;
    `;

    const params = [...vehicleIds, dateFrom, dateTo];
    const sessions = await this.sessionRepository.query(query, params);

    // Organizza le sessioni in una mappa per veicolo
    const sessionMap = new Map<number, any[]>();
    vehicleIds.forEach((id) => sessionMap.set(id, []));

    sessions.forEach((session) => {
      const vehicleId = session.veId;
      if (vehicleId) {
        sessionMap.get(vehicleId)?.push(session);
      }
    });

    return sessionMap;
  }

  /**
   * Ritorna la lista completa delle sessioni in base al VeId del veicolo
   * @param userId Serve per controllare se utente può visualizzare il veicolo
   * @param veId Veid veicolo
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @param isFilter filtra le sessioni
   * @returns oggetto DTO
   */
  async getAllSessionsByVeIdAndRange(
    userId: number,
    veId: number,
    dateFrom: Date,
    dateTo: Date,
    isFilter: boolean,
  ): Promise<SessionDTO[]> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    try {
      const sessions = await this.sessionRepository.find({
        where:
          // Sessioni completamente dentro l'intervallo
          // Sessioni che iniziano prima di period_from e cadono nell intervallo
          // Sessioni che iniziano prima di period_to e finiscono dopo il period_to
          {
            history: { vehicle: { veId: veId } },
            period_from: LessThanOrEqual(dateTo),
            period_to: MoreThanOrEqual(dateFrom),
          },
        relations: {
          history: true,
        },
        order: {
          history: {
            timestamp: 'ASC',
          },
        },
      });
      if (isFilter) {
        const today = new Date();
        if (sameDay(dateFrom, today)) {
          return sessions.length > 1
            ? [
                ...sessions
                  .slice(0, -1)
                  .filter((session) => session.sequence_id !== 0)
                  .map((session) => this.toDTOSession(session)),
                this.toDTOSession(sessions[sessions.length - 1]),
              ]
            : sessions.map((session) => this.toDTOSession(session)); // Se c'è una sola sessione, mappala direttamente
        } else {
          return sessions.length > 1
            ? sessions
                .filter((session) => session.sequence_id !== 0)
                .map((session) => this.toDTOSession(session))
            : sessions.map((session) => this.toDTOSession(session));
        }
      } else {
        return sessions.map((session) => this.toDTOSession(session));
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle sessioni veId con range temporale`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Funzione che prima chiama il recupero delle sessioni e posizioni per ogni veicolo
   * e poi controlla se sono vicini alla posizione passata in base ai km
   * @param userId user id
   * @param latitude latitudine
   * @param longitude longitudine
   * @param km km di distanza
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns
   */
  async getSessionFromPoint(
    userId: number,
    latitude: number,
    longitude: number,
    km: number,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<VehicleRangeKm[]> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    const centro = { latitude, longitude };

    // Map veId -> VehicleRangeKm object
    const vehicleMap = new Map<number, VehicleRangeKm>();

    try {
      for (const vehicle of vehicles) {
        let closest: HistoryDTO = null;
        let minDistance = Infinity;
        const sessions = await this.sessionRepository.find({
          select: {
            sequence_id: true,
            history: {
              timestamp: true,
              latitude: true,
              longitude: true,
            },
          },
          where: {
            history: { vehicle: { veId: vehicle.veId } },
            period_from: LessThanOrEqual(dateTo),
            period_to: MoreThanOrEqual(dateFrom),
          },
          relations: {
            history: true,
          },
          order: {
            history: {
              timestamp: 'ASC',
            },
          },
        });
        for (const singleSession of sessions) {
          if (Array.isArray(singleSession.history)) {
            const accepted = singleSession.history.filter((history) => {
              const distanza = getDistance(
                { latitude: history.latitude, longitude: history.longitude },
                centro,
              );
              // recupero il piu vicino
              if (distanza < minDistance) {
                minDistance = distanza;
                closest = history;
              }
              return distanza <= km * 1000;
            });

            if (accepted.length > 0) {
              // imposto il contenuto principale
              if (!vehicleMap.has(vehicle.veId)) {
                vehicleMap.set(vehicle.veId, {
                  veId: vehicle.veId,
                  plate: vehicle.plate,
                  closest: {
                    lat: closest.latitude,
                    long: closest.longitude,
                    timestamp: closest.timestamp,
                  },
                  session: [],
                });
              }

              const v = vehicleMap.get(vehicle.veId)!;
              // salvo le posizioni
              v.session.push({
                sequence_id: singleSession.sequence_id,
                history: accepted.map((h) => ({
                  lat: h.latitude,
                  long: h.longitude,
                  timestamp: new Date(h.timestamp),
                })),
              });
            }
          }
        }
      }

      return Array.from(vehicleMap.values());
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dei veicoli in base alla posizione con distanza km`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ritorna l'ultima sessione registrata di un veicolo in base al VeId
   * @param userId verifica se il mezzo è visualizzabile dall utente
   * @param veId veid del veicolo
   * @returns sessionDTO
   */
  async getLastSession(userId: number, veId: number): Promise<SessionDTO> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    try {
      const session = await this.sessionRepository.findOne({
        where: { history: { vehicle: { veId: veId } } },
        relations: {
          history: true,
        },
        order: {
          period_to: 'DESC',
        },
      });
      return session ? this.toDTOSession(session) : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle sessioni veId con range temporale`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ritorna alcuni dati dell'ultima sessione valida registrata in base ad una lista di veicoli
   * Prende soltanto le sessione dove esiste un inizio ed una fine, ed il session_id è buono
   * @param vehicleIds lista di veId identificativi veicolo
   * @returns ritorna una mappa con (veId, session);
   */
  async getLastValidSessionByVeIds(
    vehicleIds: number[],
  ): Promise<Map<number, any>> {
    try {
      // recupero molto piu veloce recuperando un veicolo alla volta,
      // più query invece che una singola massiva
      const promises = vehicleIds.map((veId) => {
        return this.sessionRepository
          .createQueryBuilder('s')
          .distinctOn(['v.veId'])
          .select([
            's.key AS key',
            's.period_to AS period_to',
            'v.veId AS veId',
          ])
          .innerJoin('history', 'h', 's.id = h.sessionId')
          .innerJoin('vehicles', 'v', 'h.vehicleId = v.id')
          .where('v.veId = :veId', { veId })
          .orderBy('v.veId')
          .addOrderBy('s.sequence_id', 'DESC')
          .getRawMany();
      });
      const result = await Promise.all(promises);
      const resultFlat = result.flat();
      const sessionMapSingle = new Map<number, any>();
      resultFlat.forEach((item) => {
        const vehicleId = item.veid;
        if (vehicleId) {
          sessionMapSingle.set(vehicleId, item);
        }
      });
      await this.setLastValidSessionRedis(sessionMapSingle);
      return sessionMapSingle;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante delle sessioni valide`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Imposto alcuni dati riguardanti l'ultima sessione per ogni veicolo su redis
   * per un recupero piu veloce
   * @param sessionMap
   */
  async setLastValidSessionRedis(sessionMap: Map<number, any>): Promise<void> {
    const pipeline = this.redis.pipeline();
    for (const [veId, session] of sessionMap) {
      const key = `lastValidSession:${veId}`;
      pipeline.set(key, JSON.stringify(session));
    }
    await pipeline.exec();
  }

  /**
   * Recupero da redis i dati riguardanti l'ultima sessione per ogni veicolo passato
   * @param vehicleIds array di veicoli
   * @returns ritorna una mappa con veId e sessione
   */
  async getLastValidSessionRedis(
    vehicleIds: number[],
  ): Promise<Map<number, any>> {
    const sessionMap = new Map<number, any>();
    const redisPromises = vehicleIds.map(async (id) => {
      const key = `lastValidSession:${id}`;
      try {
        const data = await this.redis.get(key);
        if (data) {
          sessionMap.set(id, JSON.parse(data));
        }
      } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new HttpException(
          `Errore durante recupero delle ultime sessioni da redis`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
    await Promise.all(redisPromises);
    return sessionMap;
  }

  /**
   * Ritorna alcuni dati dell'ultima posizione registrata in base ad una lista di veicoli
   * @param vehicleIds lista di veId identificativi veicolo
   * @returns ritorna una mappa con (veId, history);
   */
  async getLastHistoryByVeIds(vehicleIds: number[]): Promise<Map<number, any>> {
    try {
      // recupero molto piu veloce recuperando un veicolo alla volta,
      // più query invece che una singola massiva
      const promises = vehicleIds.map((veId) => {
        return this.historyRepository
          .createQueryBuilder('h')
          .distinctOn(['v.veId'])
          .select([
            'h.id AS id',
            'h.timestamp AS timestamp',
            'h.latitude AS latitude',
            'h.longitude AS longitude',
            'h.direction AS direction',
            'h.speed AS speed',
            'v.veId AS veId',
          ])
          .innerJoin('vehicles', 'v', 'h.vehicleId = v.id')
          .where('v.veId = :veId', { veId })
          .orderBy('v.veId')
          .addOrderBy('h.timestamp', 'DESC')
          .getRawMany();
      });
      const results = await Promise.all(promises);
      const resultFlat = results.flat();
      const historyMapSingle = new Map<number, any>();
      resultFlat.forEach((item) => {
        const vehicleId = item.veid;
        if (vehicleId) {
          historyMapSingle.set(vehicleId, item);
        }
      });
      await this.setLastHistoryRedis(historyMapSingle);
      return historyMapSingle;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dell'ultima posizione di ogni veicolo`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Imposto alcuni dati riguardanti l'ultima posizione per ogni veicolo su redis
   * per un recupero piu veloce
   * @param historyMap
   */
  async setLastHistoryRedis(historyMap: Map<number, any>): Promise<void> {
    const pipeline = this.redis.pipeline();
    for (const [veId, history] of historyMap) {
      const key = `lastHistory:${veId}`;
      pipeline.set(key, JSON.stringify(history));
    }
    await pipeline.exec();
  }

  /**
   * Recupero da redis i dati riguardanti l'ultima posizione per ogni veicolo passato
   * @param vehicleIds array di veicoli
   * @returns ritorna una mappa con veId e history
   */
  async getLastHistoryRedis(vehicleIds: number[]): Promise<Map<number, any>> {
    const historyMap = new Map<number, any>();
    const redisPromises = vehicleIds.map(async (id) => {
      const key = `lastHistory:${id}`;
      try {
        const data = await this.redis.get(key);
        if (data) {
          historyMap.set(id, JSON.parse(data));
        }
      } catch (error) {
        if (error instanceof HttpException) throw error;
        throw new HttpException(
          `Errore durante recupero delle ultime sessioni da redis`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    });
    await Promise.all(redisPromises);
    return historyMap;
  }

  /**
   * Ritorna tutte le sessioni attive, quelle con sequence_id = 0 in base all utente connesso
   * @param userId user id
   * @returns ritorno veId e active a true
   */
  async getAllActiveSession(
    userId: number,
  ): Promise<{ veId: number; active: boolean }[] | null> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
      const rawQuery = `
        WITH ranked_sessions AS (
          SELECT 
          s.id AS session_id, 
          s.sequence_id, 
          s.period_to, 
          v."veId",
          v.plate,  
            ROW_NUMBER() OVER (PARTITION BY v."veId" ORDER BY s.period_to DESC) AS rank
          FROM 
            session s
          INNER JOIN 
            history h ON h."sessionId" = s.id
          INNER JOIN 
            vehicles v ON h."vehicleId" = v.id
          WHERE 
            v."veId" = ANY($1)
            AND s.sequence_id = 0
        )
        SELECT *
        FROM ranked_sessions
        WHERE rank = 1;
      `;

      const sessions = await this.sessionRepository.query(rawQuery, [
        veIdArray,
      ]);

      const sessionMap = new Map<number, any>();

      sessions.forEach((session) => {
        const vehicleId = session.veId;
        if (vehicleId) {
          sessionMap.set(vehicleId, session);
        }
      });
      if (!sessionMap) {
        return null;
      }
      let lastSession = await this.getLastValidSessionRedis(veIdArray);
      if (!lastSession || lastSession.size === 0)
        lastSession = await this.getLastValidSessionByVeIds(veIdArray);
      if (!lastSession || lastSession.size === 0) {
        return null;
      }
      const activeSessions = [];

      sessionMap.forEach((session, vehicleId) => {
        const lastSessionEntry = lastSession.get(vehicleId);
        if (lastSessionEntry) {
          const sessionPeriodTo = new Date(session.period_to);
          const lastSessionPeriodTo = new Date(lastSessionEntry.period_to);

          if (sessionPeriodTo > lastSessionPeriodTo) {
            activeSessions.push({
              plate: session.plate,
              veId: vehicleId,
              active: true,
            });
          }
        }
      });

      return activeSessions.sort((a, b) => a.plate.localeCompare(b.plate));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante delle sessioni attive`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ritorna l'ultima sessione attiva, quella con sequence_id = 0
   * @param id VeId identificativo Veicolo
   * @returns
   */
  async getActiveSessionByVeId(
    userId: number,
    veId: number,
  ): Promise<SessionDTO | null> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    try {
      const session = await this.sessionRepository.findOne({
        where: { history: { vehicle: { veId: veId } }, sequence_id: 0 },
        order: {
          period_to: 'DESC',
        },
      });
      return session ? this.toDTOSession(session) : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero della sessione attiva`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera i tempi di lavoro, in base al mezzo e al range di ricerca, indicando
   * quanto tempo hanno lavorato giornalmente, con tempo in movimento e tempo fermi
   * @param userId id utente
   * @param veId identificativo veicolo
   * @param days giorni di ricerca da oggi all'indietro
   * @param months mesi di ricerca da oggi all'indietro
   * @returns
   */
  async getDriveStopTime(
    userId: number,
    veId: number,
    days?: number,
    months?: number,
  ): Promise<DriveStopTime[]> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);

    const dateTo = new Date();
    dateTo.setHours(0, 0, 0, 0);
    const dateFrom = new Date(dateTo);
    if (months) {
      dateFrom.setMonth(dateTo.getMonth() - months);
    } else if (days) {
      dateFrom.setDate(dateTo.getDate() - days);
    }

    try {
      const daysInRange = getDaysInRange(dateFrom, dateTo);

      // Elabora ogni giorno in parallelo
      const driveStopTimePromises = daysInRange
        .slice(0, -1)
        .map(async (day) => {
          const startOfDay = new Date(day);
          const endOfDay = new Date(day);
          endOfDay.setHours(23, 59, 59, 0);

          const sessions = await this.sessionRepository.find({
            select: {
              distance: true,
              period_from: true,
              period_to: true,
              engine_drive: true,
              engine_stop: true,
            },
            where: {
              history: {
                vehicle: {
                  veId: veId,
                },
              },
              sequence_id: Not(0),
              period_from: LessThanOrEqual(endOfDay),
              period_to: MoreThanOrEqual(startOfDay),
            },
            order: {
              sequence_id: 'ASC',
            },
          });

          // Se non ci sono sessioni, restituisco null
          if (!sessions.length) return null;

          const driveStopTime: DriveStopTime = {
            date: startOfDay,
            distance: 0,
            time: 0,
            start: 0,
            stop: 0,
          };

          for (const item of sessions) {
            driveStopTime.time += Math.abs(
              item.period_from.getTime() - item.period_to.getTime(),
            );
            driveStopTime.start += item.engine_drive * 1000;
            driveStopTime.stop += item.engine_stop * 1000;
            driveStopTime.distance += item.distance;
          }

          return driveStopTime;
        });

      // aspetto chiamatae filtro i null
      const results = await Promise.all(driveStopTimePromises);
      const driveStopTimeArray = results.filter(
        (result): result is DriveStopTime => result !== null,
      );

      return driveStopTimeArray;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle sessioni per il calcolo drive`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  private toDTOSession(session: SessionEntity): SessionDTO {
    const sessionDTO = new SessionDTO();
    sessionDTO.id = session.id;
    sessionDTO.period_from = session.period_from;
    sessionDTO.period_to = session.period_to;
    sessionDTO.sequence_id = session.sequence_id;
    sessionDTO.closed = session.closed;
    sessionDTO.distance = session.distance;
    sessionDTO.engine_drive = session.engine_drive;
    sessionDTO.engine_stop = session.engine_stop;
    const history: HistoryDTO[] = [];
    if (session.history) {
      session.history.forEach((item) => {
        history.push(this.toDTOHistory(item));
      });
    }
    sessionDTO.history = history;
    return sessionDTO;
  }
  private toDTOHistory(history: HistoryEntity): HistoryDTO {
    const historyDTO = new HistoryDTO();
    historyDTO.id = history.id;
    historyDTO.timestamp = history.timestamp;
    historyDTO.status = history.status;
    historyDTO.latitude = history.latitude;
    historyDTO.longitude = history.longitude;
    historyDTO.nav_mode = history.nav_mode;
    historyDTO.speed = history.speed;
    historyDTO.direction = history.direction;
    historyDTO.tot_distance = history.tot_distance;
    historyDTO.tot_consumption = history.tot_consumption;
    historyDTO.fuel = history.fuel;
    historyDTO.brushes = history.brushes;
    return historyDTO;
  }
}
