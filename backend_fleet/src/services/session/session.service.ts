import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { HistoryDTO } from 'classes/dtos/history.dto';
import { SessionDTO } from 'classes/dtos/session.dto';
import { HistoryEntity } from 'classes/entities/history.entity';
import { SessionEntity } from 'classes/entities/session.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import {
  DataSource,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { AssociationService } from '../association/association.service';

@Injectable()
export class SessionService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';
  // imposta il tempo di recupero dei history, ogni quanti secondi = 3 min
  private timeHistory = 180000;
  constructor(
    @InjectRepository(SessionEntity, 'readOnlyConnection')
    private readonly sessionRepository: Repository<SessionEntity>,
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
   * @returns
   */
  async getSessionist(
    suId: number,
    veId: number,
    dateFrom: string,
    dateTo: string,
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

    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const jsonResult = await parseStringPromise(response.data, {
        explicitArray: false,
      });
      if (!jsonResult) {
        console.log('vuoto jsonResult');
      }
      const lists =
        jsonResult['soapenv:Envelope']['soapenv:Body'][
          'sessionHistoryResponse'
        ]['list'];
      // per controllo sessione nulla
      // const success =
      //   jsonResult['soapenv:Envelope']['soapenv:Body'][
      //     'sessionHistoryResponse'
      //   ]['success']._;
      // console.log(success);
      //  console.log(jsonResult['soapenv:Envelope']['soapenv:Body'][
      //   'sessionHistoryResponse'
      // ]);
      if (!lists) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return false;
      }
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
        return createHash('sha256')
          .update(JSON.stringify(toHash))
          .digest('hex');
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
        return createHash('sha256')
          .update(JSON.stringify(toHash))
          .digest('hex');
      };

      const filteredDataSession = sessionLists.map((item: any) => {
        if (item['sequenceId'] === 0) {
          const hash = hashSession0(item);
          return {
            period_from: item['periodFrom'],
            period_to: item['periodTo'],
            sequence_id: item['sequenceId'],
            closed: item['closed'],
            distance: item['distance'],
            engine_drive: item['engineDriveSec'],
            engine_stop: item['engineNoDriveSec'],
            lists: item['list'],
            hash: hash,
          };
        } else {
          const hash = hashSession(item);
          return {
            period_from: item['periodFrom'],
            period_to: item['periodTo'],
            sequence_id: item['sequenceId'],
            closed: item['closed'],
            distance: item['distance'],
            engine_drive: item['engineDriveSec'],
            engine_stop: item['engineNoDriveSec'],
            lists: item['list'],
            hash: hash,
          };
        }
      });
      const sessionSequenceId = filteredDataSession.map(
        (session) => session.sequence_id,
      );

      // Esegui una query per ottenere tutte le sessioni con hash corrispondenti
      const sessionQueries = await queryRunner.manager
        .getRepository(SessionEntity)
        .find({
          select: {
            sequence_id: true,
            hash: true,
            key: true,
          },
          where: {
            sequence_id: In(sessionSequenceId),
            history: { vehicle: { veId: veId } },
          },
          order: {
            period_to: 'ASC',
          },
        });
      // Crea una mappa per abbinare gli hash alle sessioni restituite dalla query
      const sessionQueryMap = new Map(
        sessionQueries.map((query) => [query.sequence_id, query]),
      );
      const newSession = [];
      const updatedSession = [];
      for (const session of filteredDataSession) {
        // controllo se esiste hash
        const exists = sessionQueryMap.get(Number(session.sequence_id));
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
        } else if (exists.sequence_id === 0) {
          const inputDate = new Date(dateFrom);
          const today = new Date();

          if (
            inputDate.getFullYear() === today.getFullYear() &&
            inputDate.getMonth() === today.getMonth() &&
            inputDate.getDate() === today.getDate()
          ) {
            // Oggi
            updatedSession.push({
              key: exists.key,
              period_to: session.period_to,
              sequence_id: session.sequence_id,
              closed: session.closed,
              distance: session.distance,
              engine_drive: session.engine_drive,
              engine_stop: session.engine_stop,
              hash: session.hash,
            });
          } else {
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
        } else if (exists.hash !== session.hash) {
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
        }
      }
      if (newSession.length > 0) {
        await queryRunner.manager.getRepository(SessionEntity).save(newSession);
      }
      if (updatedSession.length > 0) {
        for (const session of updatedSession) {
          console.log(`update Session sequence ID ${session.sequence_id}`);
          await queryRunner.manager
            .getRepository(SessionEntity)
            .update({ key: session.key }, session);
        }
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();

      // creo array contenente l'oggetto SessionEnity necessario per relazione database e la lista di history relativa ad esso
      const sessionArray = [];
      for (const session of filteredDataSession) {
        const sessionquery = await this.getSessionByHash(session.hash);
        if (sessionquery) {
          // evita di inserire un solo oggetto e non un array nel caso session.lists abbia soltanto 1 elemento, evita problemi del .map sotto
          const sessionHistory = Array.isArray(session.lists)
            ? session.lists
            : [session.lists];
          sessionArray.push({
            sessionquery: sessionquery,
            sessionLists: sessionHistory,
          });
        }
      }

      await this.setHistory(veId, sessionArray);
      return sessionArray;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
    }
  }

  /**
   * Inserisce tutti gli history presenti associati ad una determinata sessione
   * @param id VeId identificativo Veicolo
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
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return false; // se item.list non esiste, salto elemento
      }
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
          id: id,
        };
        return createHash('sha256')
          .update(JSON.stringify(toHash))
          .digest('hex');
      };
      for (const historysession of sessionArray) {
        // controllo nel caso ci sia soltanto 1 history per una sessione
        let lastSavedTimestamp = null;
        const filteredDataHistory = historysession.sessionLists.map(
          (item: any) => {
            if (!item) {
              return []; // se item.list non esiste, salto elemento
            }
            const hash = hashHistory(item);
            // prendo timestamp corrente per confrontarlo con precedente, in modo da prendere intervalli temporali specifici
            const currentTimestamp =
              typeof item['timestamp'] === 'object' ? null : item['timestamp'];
            // lo modifico per eliminare errori di conversione
            const currentMillis = new Date(
              currentTimestamp.replace('+00', 'Z'),
            ).getTime();
            try {
              // se è il primo elemento lo salvo come corrente
              if (!lastSavedTimestamp) {
                lastSavedTimestamp = currentMillis;
              }
              // controllo se è il primo elemento oppure se la differenza tra i due è maggiore di quanto specificato
              if (
                Math.abs(currentMillis - lastSavedTimestamp) >=
                  this.timeHistory ||
                currentMillis === lastSavedTimestamp
              ) {
                lastSavedTimestamp = currentMillis;
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
              } else {
                return;
              }
            } catch (error) {
              console.log('errore nella if controllo temporale: ' + error);
            }
          },
        );

        // Filtra l'array per rimuovere gli elementi undefined
        const cleanedDataHistory = filteredDataHistory.filter(
          (item) => item !== undefined,
        );

        const vehiclequery = await queryRunner.manager
          .getRepository(VehicleEntity)
          .findOne({
            where: { veId: id },
          });

        const historyHashes = cleanedDataHistory.map((history) => history.hash);

        // Esegui una query per ottenere tutte le sessioni con hash corrispondenti
        const historyQueries = await queryRunner.manager
          .getRepository(HistoryEntity)
          .find({
            where: { hash: In(historyHashes) },
          });
        // Crea una mappa per abbinare gli hash alle sessioni restituite dalla query
        const hisotyrQueryMap = new Map(
          historyQueries.map((query) => [query.hash, query]),
        );
        // pulisce la sessione attiva da timestamp precedenti, evita duplicati e timestamp arretrati
        // if (historysession.sessionquery.sequence_id === 0) {
        //   const keys = await queryRunner.manager
        //     .getRepository(HistoryEntity)
        //     .find({
        //       select: {
        //         key: true,
        //       },
        //       where: {
        //         session: {
        //           sequence_id: 0,
        //         },
        //         vehicle: {
        //           veId: id,
        //         },
        //       },
        //     });
        //   if (keys && keys.length > 0) {
        //     const keyValues = keys.map((item) => item.key);
        //     console.log('Pulisco history sequence 0');
        //     await queryRunner.manager.getRepository(HistoryEntity).delete({
        //       key: In(keyValues),
        //     });
        //   }
        // }
        const newHistory = [];
        for (const history of cleanedDataHistory) {
          // controllo se esiste hash
          const exists = hisotyrQueryMap.get(history.hash);
          // evita che dia errore quando ci sono sessioni senza history
          if (!exists && history.length !== 0) {
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
    }
  }

  /**
   * Ricerca sessione tramite l'hash, solo dentro server
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
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    if (!vehicles.find((v) => v.veId === sessionRedis.veid))
      throw new HttpException(
        'Non hai il permesso per visualizzare questo veicolo',
        HttpStatus.FORBIDDEN,
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
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    if (!vehicles.find((v) => v.veId === veId))
      throw new HttpException(
        'Non hai il permesso per visualizzare questo veicolo',
        HttpStatus.FORBIDDEN,
      );
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
   * Ritorna la lista completa delle sessione in base al VeId del veicolo
   * @param userId Serve per controllare se utente può visualizzare il veicolo
   * @param veId Veid veicolo
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns oggetto DTO
   */
  async getAllSessionsByVeIdAndRange(
    userId: number,
    veId: number,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<SessionDTO[]> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    if (!vehicles.find((v) => v.veId === veId))
      throw new HttpException(
        'Non hai il permesso per visualizzare questo veicolo',
        HttpStatus.FORBIDDEN,
      );
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
   * Ritorna l'ultima sessione registrata di un veicolo in base al VeId
   * @param userId verifica se il mezzo è visualizzabile dall utente
   * @param veId veid del veicolo
   * @returns sessionDTO
   */
  async getLastSession(userId: number, veId: number): Promise<SessionDTO> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    if (!vehicles.find((v) => v.veId === veId))
      throw new HttpException(
        'Non hai il permesso per visualizzare questo veicolo',
        HttpStatus.FORBIDDEN,
      );
    try {
      const session = await this.sessionRepository.findOne({
        where: { history: { vehicle: { veId: veId } } },
        relations: {
          history: true,
        },
        order: {
          sequence_id: 'DESC',
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
   * Ritorna alcuni dati dell'ultima sessione registrata in base ad una lista di veicoli
   * @param vehicleIds lista di veId identificativi veicolo
   * @returns ritorna una mappa con (veId, session);
   */
  async getLastSessionByVeIds(vehicleIds: number[]): Promise<Map<number, any>> {
    const sessions = await this.sessionRepository
      .createQueryBuilder('s')
      .distinctOn(['v.veId'])
      .select([
        's.key AS key',
        's.id AS id',
        's.sequence_id AS sequence_id',
        's.period_to AS period_to',
        'v.veId AS veId',
      ])
      .innerJoin('history', 'h', 's.id = h.sessionId')
      .innerJoin('vehicles', 'v', 'h.vehicleId = v.id')
      .where('v.veId IN (:...vehicleIds)', { vehicleIds })
      .orderBy('v.veId')
      .addOrderBy('s.sequence_id', 'DESC')
      .getRawMany();

    const sessionMap = new Map<number, any>();
    sessions.forEach((session) => {
      const vehicleId = session.veid;
      if (vehicleId) {
        sessionMap.set(vehicleId, session);
      }
    });
    await this.setLastSessionRedis(sessionMap);
    return sessionMap;
  }

  /**
   * Imposto alcuni dati riguardanti l'ultima sessione per ogni veicolo su redis
   * per un recupero piu veloce
   * @param sessionMap
   */
  async setLastSessionRedis(sessionMap: Map<number, any>) {
    for (const [veId, session] of sessionMap) {
      const key = `lastSession:${veId}`;
      await this.redis.set(key, JSON.stringify(session));
    }
  }

  /**
   * Recupero da redis i dati riguardanti l'ultima sessione per ogni veicolo passato
   * @param vehicleIds array di veicoli
   * @returns ritorna una mappa con veId e sessione
   */
  async getLastSessionRedis(vehicleIds: number[]): Promise<Map<number, any>> {
    const sessionMap = new Map<number, any>();
    const redisPromises = vehicleIds.map(async (id) => {
      const key = `lastSession:${id}`;
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
   * Ritorna tutte le sessioni attive, quelle con sequence_id = 0 in base all utente connesso
   * @param userId user id
   * @returns ritorno veId e active a true
   */
  async getAllActiveSession(
    userId: number,
  ): Promise<{ veid: number; active: boolean }[] | null> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    try {
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const veIdArray = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];

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
      let lastSession = await this.getLastSessionRedis(vehicleIds);
      if (!lastSession)
        lastSession = await this.getLastSessionByVeIds(vehicleIds);
      if (!lastSession) {
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
              veId: vehicleId,
              active: true,
            });
          }
        }
      });
      return activeSessions;
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
  async getActiveSessionByVeId(userId: number, veId: number): Promise<any> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    if (!vehicles.find((v) => v.veId === veId))
      throw new HttpException(
        'Non hai il permesso per visualizzare questo veicolo',
        HttpStatus.FORBIDDEN,
      );
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

  private toDTOSession(session: SessionEntity): any {
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
