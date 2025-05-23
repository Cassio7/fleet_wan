import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { TagDTO } from 'src/classes/dtos/tag.dto';
import { DetectionTagEntity } from 'src/classes/entities/detection_tag.entity';
import { TagEntity } from 'src/classes/entities/tag.entity';
import { TagHistoryEntity } from 'src/classes/entities/tag_history.entity';
import { VehicleEntity } from 'src/classes/entities/vehicle.entity';
import { WorksiteEntity } from 'src/classes/entities/worksite.entity';
import { Between, DataSource, In, Repository } from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { AssociationService } from '../association/association.service';

@Injectable()
export class TagService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';
  constructor(
    @InjectRepository(TagHistoryEntity, 'tagReadOnly')
    private readonly tagHistoryRepository: Repository<TagHistoryEntity>,
    @InjectRepository(WorksiteEntity, 'tagReadOnly')
    private readonly worksiteRepository: Repository<WorksiteEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly associationService: AssociationService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Costruisce la richiesta SOAP
   * @param methodName nome del metodo
   * @param suId Identificativo società
   * @param veId Identificativo veicolo
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns
   */
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
   * Funzione che fa chiamata al WSDL per il recupero dei tag, in base hai parametri passati
   * @param suId Identificativo società
   * @param veId Identificativo veicolo
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @param setRedis booleano per impostare ultimo tag su redis e controllo
   * @returns
   */
  async putTagHistory(
    suId: number,
    veId: number,
    dateFrom: string,
    dateTo: string,
    setRedis: boolean,
  ): Promise<boolean> {
    const methodName = 'TagHistory';
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
    // hash dell'oggetto
    const hashTagHistoryCrypt = (tag_history: any): string => {
      const toHash = {
        timestamp: tag_history.timestamp,
        latitude: tag_history.latitude,
        longitude: tag_history.longitude,
        nav_mode: tag_history.navMode,
        geozone: tag_history.geozone,
        vehicle: veId,
      };
      return createHash('sha256').update(JSON.stringify(toHash)).digest('hex');
    };

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
      jsonResult['soapenv:Envelope']['soapenv:Body']['tagHistoryResponse'][
        'list'
      ];
    if (!lists) return false;

    const tagHistoryLists = Array.isArray(lists) ? lists : [lists];
    // ciclo tutti gli elementi e richiamo hash
    const filteredDataTagHistory = tagHistoryLists.map((item: any) => {
      const hash = hashTagHistoryCrypt(item);
      return {
        timestamp: item['timestamp'],
        latitude: item['latitude'],
        longitude: item['longitude'],
        nav_mode: item['navMode'],
        geozone: item['geozone'],
        vehicle: veId,
        list: item['list'],
        hash: hash,
      };
    });
    // true faccio il controllo ultimo tag letto, vale soltanto se la chiamata arriva dal Cron
    if (setRedis) {
      const key = `lastTagHistory:${veId}`;
      const lastTagHistoryRedis = await this.redis.get(key);
      // se ultimo tag in arrivo ha stesso hash di quello salvato salto inserimento
      if (lastTagHistoryRedis === filteredDataTagHistory[0].hash) return;
    }

    // creo un array di hash
    const hashTagHistory = filteredDataTagHistory.map(
      (tag_history) => tag_history.hash,
    );
    const tagHistoryArray: {
      tagHistory: TagHistoryEntity;
      tagHistoryData: any;
    }[] = [];

    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // recupero dal db tutti le righe con stesso hash, se sono presenti non devo inserire nuovamente
      const tagHistoryQueries = await queryRunner.manager
        .getRepository(TagHistoryEntity)
        .find({
          select: {
            id: true,
            hash: true,
          },
          where: { hash: In(hashTagHistory) },
        });

      // se il numero di tag in arrivo è uguale al numero nel db allora non inserisco nulla
      if (filteredDataTagHistory.length === tagHistoryQueries.length) {
        await queryRunner.commitTransaction();
        return;
      }
      const tagHistoryQueryMap = new Map(
        tagHistoryQueries.map((query) => [query.hash, query]),
      );
      // recupero veicolo
      const vehicle = await queryRunner.manager
        .getRepository(VehicleEntity)
        .findOne({
          where: { veId: veId },
        });
      const newTagHistory: TagHistoryEntity[] = [];
      // ciclo tutti gli elementi in arrivo
      for (const tagHistory of filteredDataTagHistory) {
        const exists = tagHistoryQueryMap.get(tagHistory.hash);
        // se non esiste l'hash lo inserisco
        if (!exists) {
          const newTagHistoryOne = queryRunner.manager
            .getRepository(TagHistoryEntity)
            .create({
              timestamp: tagHistory.timestamp,
              latitude: parseFloat(tagHistory.latitude),
              longitude: parseFloat(tagHistory.longitude),
              geozone: tagHistory.geozone,
              nav_mode: tagHistory.nav_mode,
              vehicle: vehicle,
              hash: tagHistory.hash,
            });
          newTagHistory.push(newTagHistoryOne);
        }
      }
      // se ho trovato nuovi inserimenti li salvo massivamente
      if (newTagHistory.length > 0) {
        const newTagHistoryDB = await queryRunner.manager
          .getRepository(TagHistoryEntity)
          .save(newTagHistory);
        const filteredDataMap = new Map(
          filteredDataTagHistory.map((t) => [t.hash, t]),
        );
        // creo un oggetto che comprende l'oggetto del db tagHistory e il rispettivo list in arrivo
        for (const tagHistory of newTagHistoryDB) {
          const tagHistoryEntity = filteredDataMap.get(tagHistory.hash);
          if (tagHistoryEntity) {
            const tagHistoryData = Array.isArray(tagHistoryEntity.list)
              ? tagHistoryEntity.list
              : [tagHistoryEntity.list];
            tagHistoryArray.push({
              tagHistory: tagHistory,
              tagHistoryData: tagHistoryData,
            });
          }
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nella richiesta SOAP:', error);
    } finally {
      await queryRunner.release();
    }
    // se array vuoto per qualche motivo skip
    if (!tagHistoryArray || tagHistoryArray.length === 0) return;
    // se true imposta hash dell'ultimo tag su redis
    if (setRedis) {
      try {
        const key = `lastTagHistory:${veId}`;
        const lastTagRedis = tagHistoryArray[0]?.tagHistory;
        await this.redis.set(key, lastTagRedis.hash);
      } catch (error) {
        console.log(
          `Errore inserimento lastTagHistory su redis del veid: ${veId}`,
          error,
        );
      }
    }

    await this.setTag(tagHistoryArray);
  }

  /**
   * Inserimento nel db dei tag e relativi detection entity
   * @param tagHistoryArray
   * @returns
   */
  private async setTag(
    tagHistoryArray: {
      tagHistory: TagHistoryEntity;
      tagHistoryData: any;
    }[],
  ): Promise<void> {
    if (!tagHistoryArray || tagHistoryArray.length === 0) return;

    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // ciclo tutti elementi
      for (const tagList of tagHistoryArray) {
        // recupero la lista di epc letti con detection quality
        const filteredTag = tagList.tagHistoryData
          .filter((item: any) => item)
          .map((item: any) => ({
            epc: item['epc'],
            tid: item['tid'],
            detection_quality: item['detectionQuality'],
          }));
        // array di epc per ricerca db
        const epc: string[] = filteredTag.map((tag) => tag.epc);
        const tagQuery = await queryRunner.manager
          .getRepository(TagEntity)
          .find({
            where: { epc: In(epc) },
          });
        // creo mappa di epc e oggetto TagEntity
        const tagQueryMap = new Map(
          tagQuery.map((query) => [query.epc, query]),
        );
        const newTags: TagEntity[] = [];
        // controllo se i tag esistono nel db, in caso contrario li creo
        for (const tag of filteredTag) {
          if (!tagQueryMap.has(tag.epc)) {
            const newTag = queryRunner.manager.getRepository(TagEntity).create({
              epc: tag.epc,
            });
            newTags.push(newTag);
            tagQueryMap.set(tag.epc, newTag);
          }
        }
        // salvo
        if (newTags.length > 0) {
          await queryRunner.manager.getRepository(TagEntity).save(newTags);
        }
        // creo oggetto DetectionTagEntity per definire la relazione tra Tag e TagHistory
        const newDetections = filteredTag.map((tag) => {
          return queryRunner.manager.getRepository(DetectionTagEntity).create({
            tid: tag.tid,
            detection_quality: tag.detection_quality,
            tag: tagQueryMap.get(tag.epc),
            tagHistory: tagList.tagHistory,
          });
        });
        // salvo
        if (newDetections.length > 0) {
          await queryRunner.manager
            .getRepository(DetectionTagEntity)
            .save(newDetections);
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nella richiesta SOAP:', error);
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Funzione che recupera tutti i tag history e relativi dati in base al veicolo passato
   * @param userId user id
   * @param veId veid veicolo
   * @returns DTO
   */
  async getAllTagHistoryByVeId(
    userId: number,
    veId: number,
  ): Promise<TagDTO[]> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    try {
      const tags = await this.tagHistoryRepository.find({
        select: {
          timestamp: true,
          latitude: true,
          longitude: true,
          geozone: true,
          nav_mode: true,
          detectiontag: {
            detection_quality: true,
            tid: true,
            tag: {
              id: true,
              epc: true,
            },
          },
        },
        where: { vehicle: { veId: veId } },
        relations: {
          detectiontag: {
            tag: true,
          },
        },
      });
      return tags.flatMap((tag) => this.toDTOTag(tag));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dei tag`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ritorna i tag history in base all VeId e al range di date specificato
   * @param userId user id
   * @param veId VeId Veicolo
   * @param dateFrom Data inizio ricerca tag history
   * @param dateTo Data fine ricerca tag history
   * @returns DTO
   */
  async getTagHistoryByVeIdRanged(
    userId: number,
    veId: number,
    dateFrom: Date,
    dateTo: Date,
    less: boolean,
  ): Promise<TagDTO[]> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    try {
      const tags = await this.tagHistoryRepository.find({
        where: {
          vehicle: { veId: veId },
          timestamp: Between(dateFrom, dateTo),
        },
        relations: {
          detectiontag: {
            tag: true,
          },
        },
      });
      // recupera tag con posizione univoca e, del totale, ne prende solo il 25%
      if (less) {
        const seen = new Set<string>();
        const uniqueTags = tags.filter((tag) => {
          const key = `${tag.latitude},${tag.longitude}`;
          if (seen.has(key)) {
            return false;
          } else {
            seen.add(key);
            return true;
          }
        });
        const percentage = 25;
        const count = Math.ceil(uniqueTags.length * (percentage / 100));
        const sampledTags = uniqueTags
          .sort(() => Math.random() - 0.5)
          .slice(0, count);

        return sampledTags.flatMap((tag) => this.toDTOTag(tag));
      } else {
        return tags.flatMap((tag) => this.toDTOTag(tag));
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle sessioni veId con range temporale`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async noAPIgetTagHistoryByVeIdRanged(
    veId: number[],
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Map<number, number[]>> {
    try {
      const tags = await this.tagHistoryRepository
        .createQueryBuilder('tag_history')
        .leftJoinAndSelect('tag_history.vehicle', 'vehicle')
        .leftJoinAndSelect('tag_history.detectiontag', 'detectiontag')
        .select([
          'tag_history.id',
          'vehicle.veId',
          'detectiontag.detection_quality',
        ])
        .where('vehicle.veId IN (:...veId)', { veId })
        .andWhere('tag_history.timestamp BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        })
        .getMany();
      const tagMap = new Map<number, number[]>(); // Mappa veId -> detection_quality[]
      veId.forEach((id) => tagMap.set(id, [])); // Prepara array vuoti

      tags.forEach((tag) => {
        const vehicleId = tag.vehicle.veId;
        if (vehicleId) {
          const vehicleQualities = tagMap.get(vehicleId);
          if (vehicleQualities) {
            tag.detectiontag.forEach((detection) => {
              if (detection.detection_quality != null) {
                vehicleQualities.push(detection.detection_quality);
              }
            });
          }
        }
      });
      return tagMap;
    } catch (error) {
      console.error(error);
    }
  }
  /**
   * Recupera l'ultimo tag letto di ogni veicolo passato come parametro, in base al range temporale inserito
   * Funzione richiamata solo dentro il server
   * @param vehicleIds lista di veId identificativi veicolo
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns ritorna una mappa con (veId, tag)
   */
  async getLastTagHistoryByVeIdsAndRange(
    vehicleIds: number[],
    dateFrom: Date,
    dateTo: Date,
  ): Promise<Map<number, any>> {
    const query = `
    SELECT DISTINCT ON (v."veId") 
      t.timestamp,
      v."veId"
    FROM tag_history t
    INNER JOIN vehicles v ON t."vehicleId" = v.id
    WHERE v."veId" IN (${vehicleIds.map((_, index) => `$${index + 1}`).join(',')})
      AND t.timestamp BETWEEN $${vehicleIds.length + 1} AND $${vehicleIds.length + 2}
    ORDER BY v."veId", t.timestamp DESC;
  `;
    const params = [...vehicleIds, dateFrom, dateTo];
    const tags = await this.tagHistoryRepository.query(query, params);

    // Organizza i tag in una mappa per veicolo
    const tagMap = new Map<number, any>();
    vehicleIds.forEach((id) => tagMap.set(id, null));
    tags.forEach((tag) => {
      const vehicleId = tag.veId;
      if (vehicleId) {
        tagMap.set(vehicleId, tag);
      }
    });

    return tagMap;
  }

  /**
   * Ritorna soltanto l'ultimo tag letto in base al veicolo passato
   * @param userId user id
   * @param veId veid veicolo
   * @returns DTO
   */
  async getLastTagHistoryByVeId(
    userId: number,
    veId: number,
  ): Promise<TagDTO[]> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    try {
      const tag = await this.tagHistoryRepository.findOne({
        where: {
          vehicle: { veId: veId },
        },
        relations: {
          detectiontag: {
            tag: true,
          },
        },
        order: {
          timestamp: 'DESC',
        },
      });
      return tag ? this.toDTOTag(tag) : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dell'ultimo tag`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera le letture dei tag in base: ai veicoli associati all utente, al range temporale inserito
   * e se inserisce un cantiere, anche in base al cantiere di appartenenza di un veicolo
   * @param userId user id
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @param worksiteId id del cantiere se presente
   * @returns
   */
  async getTagsByRangeWorksite(
    userId: number,
    dateFrom: Date,
    dateTo: Date,
    worksiteId: number[],
    limit: boolean,
  ): Promise<TagDTO[]> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
      const countWorksites = await this.worksiteRepository.count();
      let query;
      if (worksiteId.length > 0 && worksiteId.length != countWorksites) {
        query = this.tagHistoryRepository
          .createQueryBuilder('tagHistory')
          .select([
            'tagHistory.timestamp',
            'tagHistory.latitude',
            'tagHistory.longitude',
            'detectiontag.detection_quality',
            'tag.epc',
            'vehicle.plate',
            'worksite.name',
          ])
          .leftJoin('tagHistory.detectiontag', 'detectiontag')
          .leftJoin('detectiontag.tag', 'tag')
          .leftJoin('tagHistory.vehicle', 'vehicle')
          .leftJoin('vehicle.worksite', 'worksite')
          .where('vehicle.veId IN (:...veIdArray)', { veIdArray })
          .andWhere('tagHistory.timestamp BETWEEN :dateFrom AND :dateTo', {
            dateFrom,
            dateTo,
          })
          .andWhere('worksite.id IN (:...worksiteId)', { worksiteId })
          .orderBy('tagHistory.timestamp', 'ASC');
      } else {
        query = this.tagHistoryRepository
          .createQueryBuilder('tagHistory')
          .select([
            'tagHistory.timestamp',
            'tagHistory.latitude',
            'tagHistory.longitude',
            'detectiontag.detection_quality',
            'tag.epc',
            'vehicle.plate',
            'worksite.name',
          ])
          .leftJoin('tagHistory.detectiontag', 'detectiontag')
          .leftJoin('detectiontag.tag', 'tag')
          .leftJoin('tagHistory.vehicle', 'vehicle')
          .leftJoin('vehicle.worksite', 'worksite')
          .where('vehicle.veId IN (:...veIdArray)', { veIdArray })
          .andWhere('tagHistory.timestamp BETWEEN :dateFrom AND :dateTo', {
            dateFrom,
            dateTo,
          })
          .orderBy('tagHistory.timestamp', 'ASC');
      }
      if (limit) {
        query.limit(100);
      }
      const tags = await query.getMany();
      return tags.flatMap((tag) => this.toDTOTagLessInfo(tag));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero delle sessioni veId con range temporale`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ritorno il numero di tag letti in quel periodo
   * @param userId id utente
   * @param dateFrom inizio ricerca
   * @param dateTo fine ricerca
   * @param worksiteId id del cantiere se esiste
   * @returns
   */
  async getNCountTagsRange(
    userId: number,
    dateFrom: Date,
    dateTo: Date,
    worksiteId: number[],
  ): Promise<number> {
    const veIdArray =
      await this.associationService.getVehiclesRedisAllSet(userId);
    let tags;
    if (worksiteId.length > 0) {
      tags = await this.tagHistoryRepository
        .createQueryBuilder('tagHistory')
        .leftJoin('tagHistory.detectiontag', 'detectiontag')
        .leftJoin('detectiontag.tag', 'tag')
        .leftJoin('tagHistory.vehicle', 'vehicle')
        .leftJoin('vehicle.worksite', 'worksite')
        .where('vehicle.veId IN (:...veIdArray)', { veIdArray })
        .andWhere('tagHistory.timestamp BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        })
        .andWhere('worksite.id IN (:...worksiteId)', { worksiteId })
        .select('COUNT(tag.id)', 'count') // Conta il numero di tag
        .getRawOne(); // Usa getRawOne per ottenere il conteggio del tag
    } else {
      tags = await this.tagHistoryRepository
        .createQueryBuilder('tagHistory')
        .leftJoin('tagHistory.detectiontag', 'detectiontag')
        .leftJoin('detectiontag.tag', 'tag')
        .leftJoin('tagHistory.vehicle', 'vehicle')
        .leftJoin('vehicle.worksite', 'worksite')
        .where('vehicle.veId IN (:...veIdArray)', { veIdArray })
        .andWhere('tagHistory.timestamp BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        })
        .select('COUNT(tag.id)', 'count') // Conta il numero di tag
        .getRawOne(); // Usa getRawOne per ottenere il conteggio del tag
    }
    const count = tags ? parseInt(tags.count, 10) : 0;
    return count;
  }

  /**
   * Funzione che ritorna i detection quality in base al veicolo inserito, in base al mese o giorno.
   * Una volta stabilito il range corretto, le letture vengono prese e viene fatta una media giornaliera e vengono tornati
   * @param userId id utente
   * @param veId veid veicolo
   * @param months numero mesi
   * @param days numero giorni
   * @returns
   */
  async getDetectionQualityByVeId(
    userId: number,
    veId: number,
    months: number,
    days: number,
  ): Promise<any> {
    await this.associationService.checkVehicleAssociateUserSet(userId, veId);
    try {
      let detections = [];
      // tutto a 0 o vuoto prendo i dati di sempre
      if (!months && !days) {
        detections = await this.tagHistoryRepository.find({
          select: {
            timestamp: true,
            detectiontag: {
              detection_quality: true,
            },
          },
          where: {
            vehicle: {
              veId: veId,
            },
          },
          relations: {
            detectiontag: true,
          },
          order: {
            timestamp: 'ASC',
          },
        });
      }
      // giorno diverso da 0 e mese a 0, da priorità al giorno
      else if (!months && days) {
        const dateFrom = new Date();
        const dateTo = new Date();
        dateTo.setDate(dateTo.getDate() - days);
        detections = await this.tagHistoryRepository.find({
          select: {
            timestamp: true,
            detectiontag: {
              detection_quality: true,
            },
          },
          where: {
            vehicle: {
              veId: veId,
            },
            timestamp: Between(dateTo, dateFrom),
          },
          relations: {
            detectiontag: true,
          },
          order: {
            timestamp: 'ASC',
          },
        });
      }
      // da priorità al mese
      else {
        const dateFrom = new Date();
        const dateTo = new Date();
        dateTo.setMonth(dateTo.getMonth() - months);
        detections = await this.tagHistoryRepository.find({
          select: {
            timestamp: true,
            detectiontag: {
              detection_quality: true,
            },
          },
          where: {
            vehicle: {
              veId: veId,
            },
            timestamp: Between(dateTo, dateFrom),
          },
          relations: {
            detectiontag: true,
          },
          order: {
            timestamp: 'ASC',
          },
        });
      }
      // Definizione del tipo per il valore dell'accumulatore
      type GroupedData = {
        totalQuality: number;
        count: number;
      };

      // Raggruppo per giorno e calcolo la somma e il conteggio dei detection tag
      const groupedByDay = detections.reduce<Record<string, GroupedData>>(
        (acc, item) => {
          const dayKey = new Date(item.timestamp).toISOString().slice(0, 10); // Arrotonda alla data (YYYY-MM-DD)

          if (!acc[dayKey]) {
            acc[dayKey] = { totalQuality: 0, count: 0 };
          }

          const detectionSum = item.detectiontag.reduce(
            (sum, tag) => sum + tag.detection_quality,
            0,
          );

          acc[dayKey].totalQuality += detectionSum;
          acc[dayKey].count += item.detectiontag.length;

          return acc;
        },
        {},
      );

      // Trasformo il risultato in un array con media per ogni giorno
      const result = Object.entries(groupedByDay).map(([day, data]) => {
        const avgQuality = parseFloat(
          (data.totalQuality / data.count).toFixed(1),
        ); // Arrotonda alla prima cifra decimale
        return {
          timestamp: `${day}T00:00:00.000Z`, // Normalizzo il timestamp a inizio giorno
          detection_quality: avgQuality,
        };
      });

      return result;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dei detection tag`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private toDTOTag(taghistory: TagHistoryEntity): TagDTO[] {
    return taghistory.detectiontag.map((detection) => {
      const tagDTO = new TagDTO();
      tagDTO.id = detection.tag.id;
      tagDTO.epc = detection.tag.epc;
      tagDTO.tid = detection.tid;
      tagDTO.detection_quality = detection.detection_quality;
      tagDTO.timestamp = taghistory.timestamp;
      tagDTO.latitude = taghistory.latitude;
      tagDTO.longitude = taghistory.longitude;
      tagDTO.plate = taghistory.vehicle?.plate;
      tagDTO.nav_mode = taghistory.nav_mode;
      tagDTO.geozone = taghistory.geozone;

      return tagDTO;
    });
  }
  private toDTOTagLessInfo(taghistory: TagHistoryEntity): TagDTO[] {
    return taghistory.detectiontag.map((detection) => {
      const tagDTO = new TagDTO();
      tagDTO.epc = detection.tag.epc;
      tagDTO.detection_quality = detection.detection_quality;
      tagDTO.timestamp = taghistory.timestamp;
      tagDTO.latitude = taghistory.latitude;
      tagDTO.longitude = taghistory.longitude;
      tagDTO.plate = taghistory.vehicle?.plate;
      tagDTO.worksite = taghistory.vehicle?.worksite?.name;

      return tagDTO;
    });
  }
}
