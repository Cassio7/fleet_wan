import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DetectionTagEntity } from 'classes/entities/detection_tag.entity';
import { TagEntity } from 'classes/entities/tag.entity';
import { TagHistoryEntity } from 'classes/entities/tag_history.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import { convertHours } from 'src/utils/utils';
import {
  Between,
  DataSource,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class TagService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';
  constructor(
    @InjectRepository(TagHistoryEntity, 'readOnlyConnection')
    private readonly tagHistoryRepository: Repository<TagHistoryEntity>,
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
          timestamp: convertHours(item['timestamp']),
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
   * Ritorna i tag history in base all VeId
   */
  async getTagHistoryByVeId(id: number): Promise<any> {
    const tags = await this.tagHistoryRepository.find({
      where: { vehicle: { veId: id } },
      relations: {
        detectiontag: {
          tag: true,
        },
      },
    });
    return tags;
  }

  /**
   * Ritorna i tag history in base all VeId e al range di date specificato
   * @param id VeId Veicolo
   * @param dateFrom Data inizio ricerca tag history
   * @param dateTo  Data fine ricerca tag history
   * @returns
   */
  async getTagHistoryByVeIdRanged(
    id: number,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any> {
    const tags = await this.tagHistoryRepository.find({
      where: {
        vehicle: { veId: id },
        timestamp: MoreThanOrEqual(dateFrom) && LessThanOrEqual(dateTo),
      },
      relations: {
        detectiontag: {
          tag: true,
        },
      },
    });
    return tags;
  }

  /**
   * @param id VeId Veicolo
   * @param dateFrom Data inizio ricerca tag history
   * @param dateTo Data fine ricerca tag history
   * @returns
   */
  async getLastTagHistoryByVeIdRanged(
    id: number,
    dateFrom: Date,
    dateTo: Date,
  ): Promise<any> {
    const tags = await this.tagHistoryRepository.findOne({
      where: {
        vehicle: { veId: id },
        timestamp: Between(dateFrom, dateTo),
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
    return tags;
  }
  /**
   * Ritorna l'ultimo tag letto, se esiste, in un determinato range di tempo
   * @param period_from periodo di inizio ricerca
   * @param period_to periodo di fine ricerca
   * @returns
   */
  async getLastTagInTimeRange(
    period_from: Date,
    period_to: Date,
    vehicleId: number,
  ) {
    const tags = await this.tagHistoryRepository.findOne({
      where: {
        vehicle: {
          veId: vehicleId,
        },
        timestamp: LessThanOrEqual(period_to) && MoreThanOrEqual(period_from),
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
    return tags;
  }

  /**
   * Ritorna soltanto l'ultimo tag history registrato in base al timestamp e al VeId
   * @param id VeId
   * @returns
   */
  async getLastTagHistoryByVeId(id: number): Promise<any> {
    const tags = await this.tagHistoryRepository.findOne({
      where: {
        vehicle: { veId: id },
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
    return tags;
  }
  /**
   * Funzione che ritorna tutti i detection quality e il timestamp in base al veicolo
   * @param id veId identificativo del veicolo
   * @returns
   */
  async getDetectionQualityBiVeId(id: number): Promise<any> {
    const detections = await this.tagHistoryRepository.find({
      select: {
        timestamp: true,
        detectiontag: {
          detection_quality: true,
        },
      },
      where: {
        vehicle: {
          veId: id,
        },
      },
      relations: {
        detectiontag: true,
      },
    });
    return detections;
  }
}
