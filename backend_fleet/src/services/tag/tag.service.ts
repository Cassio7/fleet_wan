import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DetectionTagDTO } from 'classes/dtos/detection_tag.dto';
import { TagDTO } from 'classes/dtos/tag.dto';
import { TagHistoryDTO } from 'classes/dtos/tag_history.dto';
import { DetectionTagEntity } from 'classes/entities/detection_tag.entity';
import { TagEntity } from 'classes/entities/tag.entity';
import { TagHistoryEntity } from 'classes/entities/tag_history.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import {
  Between,
  DataSource,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { AssociationService } from '../association/association.service';

@Injectable()
export class TagService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';
  constructor(
    @InjectRepository(TagHistoryEntity, 'readOnlyConnection')
    private readonly tagHistoryRepository: Repository<TagHistoryEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
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
  async putTagHistory(
    suId: number,
    veId: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<any> {
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
    const queryRunner = this.connection.createQueryRunner();
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

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const jsonResult = await parseStringPromise(response.data, {
        explicitArray: false,
      });
      if (!jsonResult) {
        await queryRunner.commitTransaction();
        await queryRunner.release();
        return false;
      }
      const lists =
        jsonResult['soapenv:Envelope']['soapenv:Body']['tagHistoryResponse'][
          'list'
        ];
      if (!lists) {
        await queryRunner.commitTransaction();
        await queryRunner.release();
        return false;
      }

      const tagHistoryLists = Array.isArray(lists) ? lists : [lists];

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

      const hashTagHistory = filteredDataTagHistory.map(
        (tag_history) => tag_history.hash,
      );
      const tagHistoryQueries = await queryRunner.manager
        .getRepository(TagHistoryEntity)
        .find({
          where: { hash: In(hashTagHistory) },
        });
      const tagHistoryQueryMap = new Map(
        tagHistoryQueries.map((query) => [query.hash, query]),
      );
      const vehicle = await queryRunner.manager
        .getRepository(VehicleEntity)
        .findOne({
          where: { veId: veId },
        });
      const newTagHistory = [];
      for (const tagHistory of filteredDataTagHistory) {
        const exists = tagHistoryQueryMap.get(tagHistory.hash);
        if (!exists) {
          const newTagHistoryOne = await queryRunner.manager
            .getRepository(TagHistoryEntity)
            .create({
              timestamp: tagHistory.timestamp,
              latitude: tagHistory.latitude,
              longitude: tagHistory.longitude,
              geozone: tagHistory.geozone,
              nav_mode: tagHistory.nav_mode,
              vehicle: vehicle,
              hash: tagHistory.hash,
            });
          newTagHistory.push(newTagHistoryOne);
        }
      }
      const tagHistoryArray = [];
      if (newTagHistory.length > 0) {
        await queryRunner.manager
          .getRepository(TagHistoryEntity)
          .save(newTagHistory);

        for (const tagHistory of filteredDataTagHistory) {
          const tagHistoryEntity = await queryRunner.manager
            .getRepository(TagHistoryEntity)
            .findOne({
              where: { hash: tagHistory.hash },
            });
          if (tagHistoryEntity) {
            const tagHistoryData = Array.isArray(tagHistory.list)
              ? tagHistory.list
              : [tagHistory.list];
            tagHistoryArray.push({
              tagHistory: tagHistoryEntity,
              tagHistoryData: tagHistoryData,
            });
          }
        }
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();
      await this.setTag(tagHistoryArray);
      return lists;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
    }
  }

  private async setTag(tagHistoryArray) {
    const queryRunner = this.connection.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      if (!tagHistoryArray) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return false;
      }
      for (const tagList of tagHistoryArray) {
        //console.log(tagList);
        const filteredTag = tagList.tagHistoryData.map((item: any) => {
          if (!item) {
            return []; // se item.list non esiste, salto elemento
          }
          return {
            epc: item['epc'],
            tid: item['tid'],
            detection_quality: item['detectionQuality'],
          };
        });
        const epc = filteredTag.map((tag) => tag.epc);
        let tagQuery = await queryRunner.manager.getRepository(TagEntity).find({
          where: { epc: In(epc) },
        });
        let tagQueryMap = new Map(tagQuery.map((query) => [query.epc, query]));
        const newTags = [];
        const newDetections = [];
        for (const tag of filteredTag) {
          const exists = tagQueryMap.get(tag.epc);
          if (!exists) {
            const newTag = await queryRunner.manager
              .getRepository(TagEntity)
              .create({
                epc: tag.epc,
              });
            newTags.push(newTag);
          }
        }
        if (newTags.length > 0) {
          await queryRunner.manager.getRepository(TagEntity).save(newTags);
        }
        tagQuery = await queryRunner.manager.getRepository(TagEntity).find({
          where: { epc: In(epc) },
        });
        tagQueryMap = new Map(tagQuery.map((query) => [query.epc, query]));
        for (const tag of filteredTag) {
          const newDetection = await queryRunner.manager
            .getRepository(DetectionTagEntity)
            .create({
              tid: tag.tid,
              detection_quality: tag.detection_quality,
              tag: tagQueryMap.get(tag.epc),
              tagHistory: tagList.tagHistory,
            });
          newDetections.push(newDetection);
        }
        if (newDetections.length > 0) {
          await queryRunner.manager
            .getRepository(DetectionTagEntity)
            .save(newDetections);
        }
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
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
  ): Promise<TagHistoryDTO[]> {
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
      const tags = await this.tagHistoryRepository.find({
        where: { vehicle: { veId: veId } },
        relations: {
          detectiontag: {
            tag: true,
          },
        },
      });
      return tags.map((tag) => this.toDTOTagHistory(tag));
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
  ): Promise<any> {
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
      const tags = await this.tagHistoryRepository.find({
        where: {
          vehicle: { veId: veId },
          timestamp: MoreThanOrEqual(dateFrom) && LessThanOrEqual(dateTo),
        },
        relations: {
          detectiontag: {
            tag: true,
          },
        },
      });
      return tags.map((tag) => this.toDTOTagHistory(tag));
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
  ): Promise<TagHistoryDTO | null> {
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
      return tag ? this.toDTOTagHistory(tag) : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dell'ultimo tag`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Funzione che ritorna i detection quality in base al veicolo inserito, in base al mese o giorno.
   * Una volta stabilito il range corretto, le letture vengono prese e viene fatta una media giornaliera e vengono tornati
   * @param userId id utente
   * @param veId veid veicolo
   * @returns
   */
  async getDetectionQualityByVeId(
    userId: number,
    veId: number,
    months: number,
    days: number,
  ): Promise<any> {
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

  private toDTOTagHistory(taghistory: TagHistoryEntity): any {
    const tagHistoryDTO = new TagHistoryDTO();
    tagHistoryDTO.id = taghistory.id;
    tagHistoryDTO.timestamp = taghistory.timestamp;
    tagHistoryDTO.latitude = taghistory.latitude;
    tagHistoryDTO.longitude = taghistory.longitude;
    tagHistoryDTO.nav_mode = taghistory.nav_mode;
    tagHistoryDTO.geozone = taghistory.geozone;
    const detection_tag: DetectionTagDTO[] = [];
    if (taghistory.detectiontag) {
      taghistory.detectiontag.forEach((item) => {
        detection_tag.push(this.toDTODetectionTag(item));
      });
    }
    tagHistoryDTO.detection_tag = detection_tag;
    return tagHistoryDTO;
  }

  private toDTODetectionTag(detectiontag: DetectionTagEntity): DetectionTagDTO {
    const detectionTagDTO = new DetectionTagDTO();
    detectionTagDTO.id = detectiontag.id;
    detectionTagDTO.tid = detectiontag.tid;
    detectionTagDTO.detection_quality = detectiontag.detection_quality;
    if (detectiontag.tag) {
      detectionTagDTO.tag = new TagDTO();
      detectionTagDTO.tag.id = detectiontag.tag.id;
      detectionTagDTO.tag.epc = detectiontag.tag.epc;
    }
    return detectionTagDTO;
  }
}
