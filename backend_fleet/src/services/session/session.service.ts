import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { HistoryEntity } from 'classes/entities/history.entity';
import { SessionEntity } from 'classes/entities/session.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import {
  DataSource,
  In,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { convertHours } from 'src/utils/utils';

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
    const requestXml = this.buildSoapRequest(methodName,suId, veId, dateFrom, dateTo);
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
        jsonResult['soapenv:Envelope']['soapenv:Body'][
          'sessionHistoryResponse'
        ]['list'];

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
        };
        return createHash('sha256')
          .update(JSON.stringify(toHash))
          .digest('hex');
      };
      const filteredDataSession = sessionLists.map((item: any) => {
        const hash = hashSession(item);
        return {
          period_from: convertHours(item['periodFrom']),
          period_to: convertHours(item['periodTo']),
          sequence_id: item['sequenceId'],
          closed: item['closed'],
          distance: item['distance'].split('.').join(''),
          engine_drive: item['engineDriveSec'],
          engine_stop: item['engineNoDriveSec'],
          lists: item['list'],
          hash: hash,
        };
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
          relations: {
            history: {
              vehicle: true,
            },
          },
          where: {
            sequence_id: In(sessionSequenceId),
            history: { vehicle: { veId: veId } },
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
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
  
  // /**
  //  * Ritorna l'ultima sessione di ciascun veicolo
  //  * @returns 
  //  */
  // async getAllVehiclesLastSessions() {
  //   try {
  //     const sessions = await this.sessionRepository.find({
  //       relations: {
  //         history: {
  //           vehicle: true,
  //         } 
  //       },
  //       order: {
  //         createdAt: "DESC" 
  //       },
  //     });
  //     return sessions;
  //   } catch (error) {
  //     console.error("Errore nel recupero delle ultime sessioni per i veicoli:", error);
  //     throw new Error("Non è stato possibile recuperare le ultime sessioni per i veicoli.");
  //   }
  // }
  
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
              typeof item['timestamp'] === 'object'
                ? null
                : convertHours(item['timestamp']);
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
                      : convertHours(item['timestamp']),
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
        if (historysession.sessionquery.sequence_id === 0) {
          const keys = await queryRunner.manager
            .getRepository(HistoryEntity)
            .find({
              select: {
                key: true,
              },
              where: {
                session: {
                  sequence_id: 0,
                },
                vehicle: {
                  veId: id,
                },
              },
            });
          if (keys && keys.length > 0) {
            const keyValues = keys.map((item) => item.key);
            console.log('Pulisco history sequence 0');
            await queryRunner.manager.getRepository(HistoryEntity).delete({
              key: In(keyValues),
            });
          }
        }
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
   * Ritorna le sessioni, se esiste, in un range di tempo specificato
   * @param from_time data di inizio ricerca
   * @param to_time data di fine ricerca
   * @returns
   */
  async getSessionInTimeRange(from_time: Date, to_time: Date) {
    const session = await this.sessionRepository.find({
      where: {
        period_from: LessThanOrEqual(to_time),
        period_to: MoreThanOrEqual(from_time),
      },
      relations: {
        history: {
          vehicle: true,
        },
      },
    });
    return session;
  }

  /**
   * Ritorna la lista completa delle sessione in base al VeId del veicolo
   * @param id VeId identificativo Veicolo
   * @returns
   */
  async getAllSessionByVeId(id: number): Promise<any> {
    const session = await this.sessionRepository.find({
      where: { history: { vehicle: { veId: id } } },
      relations: {
        history: true,
      },
      order: {
        period_to: 'DESC',
      },
    });
    return session;
  }

  /**
   * Restituisce le sessioni in base al VeId del veicolo e al range temporale inserito
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

  /**
   * Restituisce l'ultima sessione in base al veId del veicolo e al range temporale inserito
   * @param id VeId identificativo Veicolo
   * @param dateFrom Data inizio ricerca sessione
   * @param dateTo Data fine ricerca sessione
   * @returns
   */
  async getLastSessionByVeIdRanged(
    id: number,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any> {
    const session = await this.sessionRepository.findOne({
      where: {
        history: { vehicle: { veId: id } },
        period_from: MoreThanOrEqual(dateFrom),
        period_to: LessThanOrEqual(dateTo),
      },
      relations: {
        history: true,
      },
      order: {
        sequence_id: 'DESC',
      },
    });
    return session;
  }

    /**
   * Restituisce l'ultima sessione di ogni veicolo in base al range temporale inserito
   * @param id VeId identificativo Veicolo
   * @param dateFrom Data inizio ricerca sessione
   * @param dateTo Data fine ricerca sessione
   * @returns
   */
    async getAllVehiclesLastSessionByVeIdRanged(
      dateFrom: Date,
      dateTo: Date,
    ): Promise<any> {
      const session = await this.sessionRepository.findOne({
        where: {
          period_from: MoreThanOrEqual(dateFrom),
          period_to: LessThanOrEqual(dateTo),
        },
        relations: {
          history: true,
        },
        order: {
          sequence_id: 'DESC',
        },
      });
      return session;
    }

  /**
   * Ritorna l'ultima sessione registrata di un veicolo in base al VeId
   * @param id VeId identificativo Veicolo
   * @returns
   */
  async getLastSession(id): Promise<any> {
    const session = await this.sessionRepository.findOne({
      where: { history: { vehicle: { veId: id } } },
      relations: {
        history: {
          vehicle: true
        },
      },
      order: {
        sequence_id: 'DESC',
      },
    });
    return session;
  }

  /**
   * Ritorna l'ultima sessione di tutti i veicoli registrata in base all'id
   * che ha percorso più di 0 metri di distanza
   * la session è durata almeno 2 minuti (quindi valida)
   * @param id VeId identificativo Veicolo
   * @returns
   */
  async getLastValidSessionAll(id: number) {
    const session = await this.sessionRepository.find({
      where: {
        history: {
          vehicle: {
            veId: id,
          },
        },
        distance: MoreThan(0), //controllo distanza maggiore di 0
      },
      relations: {
        history: true,
      },
      order: {
        sequence_id: 'DESC',
      },
    });

    return session;
  }

  /**
   * Ritorna l'ultima sessione di un veicolo registrata in base all'id
   * che ha percorso più di 0 metri di distanza
   * la session è durata almeno 2 minuti (quindi valida)
   * @param id VeId identificativo Veicolo
   * @returns
   */
  async getLastValidSession(id: number) {
    const session = await this.sessionRepository.findOne({
      where: {
        history: {
          vehicle: {
            veId: id,
          },
        },
        distance: MoreThan(0), //controllo distanza maggiore di 0
      },
      relations: {
        history: true,
      },
      order: {
        sequence_id: 'DESC',
      },
    });

    return session;
  }
  /**
   * Ritorna l'ultima sessione attiva, quella con sequence_id = 0
   * @param id VeId identificativo Veicolo
   * @returns
   */
  async getActiveSessionByVeId(id): Promise<any> {
    const session = await this.sessionRepository.findOne({
      where: { history: { vehicle: { veId: id } }, sequence_id: 0 },
      relations: {
        history: true,
      },
    });
    return session;
  }
  /**
   * Ritorna tutte le sessioni attive, quelle con sequence_id = 0
   * @returns
   */
  async getAllActiveSession(): Promise<any> {
    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .distinctOn(['session.id']) // Distinct ON per session.id
      .innerJoin('session.history', 'history')
      .innerJoin('history.vehicle', 'vehicle')
      .where('session.sequence_id = :sequenceId', { sequenceId: 0 })
      .select([
        'session', // tutti i campi di session
        'vehicle.id', // campo id di vehicle
        'vehicle.veId', // campo veId di vehicle
      ])
      .getRawMany();

    return sessions;
  }

  /**
   * Ritorna tutte le distanze registrate di tutte le sessioni di un veicolo in base al VeId
   * @param id VeId identificativo Veicolo
   * @returns
   */
  async getDistanceSession(id): Promise<any> {
    const distances = await this.sessionRepository.find({
      where: { history: { vehicle: { veId: id } } },
      select: { distance: true, period_from: true, period_to: true },
    });
    return distances;
  }
}
