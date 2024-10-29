import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import axios from 'axios';
import { DetectionTagEntity } from 'classes/entities/detection_tag.entity';
import { TagEntity } from 'classes/entities/tag.entity';
import { TagHistoryEntity } from 'classes/entities/tag_history.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import { convertHours } from 'src/utils/hoursFix';
import { DataSource, In } from 'typeorm';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class TagService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';
  constructor(
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
  async putTagHistory(
    id: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<any> {
    const methodName = 'TagHistory';
    const requestXml = this.buildSoapRequest(methodName, id, dateFrom, dateTo);
    const headers = {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `"${methodName}"`,
    };

    const queryRunner = this.connection.createQueryRunner();

    const hashTagHistoryCrypt = (tag_history: any): string => {
      const toHash = {
        timestamp: tag_history.timestamp,
        latitude: tag_history.latitude,
        longitude: tag_history.longitude,
        nav_mode: tag_history.navMode,
        geozone: tag_history.geozone,
        vehicle: id,
      };
      return createHash('sha256').update(JSON.stringify(toHash)).digest('hex');
    };

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
          vehicle: id,
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
          where: { veId: id },
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
      if (newTagHistory.length > 0) {
        await queryRunner.manager
          .getRepository(TagHistoryEntity)
          .save(newTagHistory);
        const tagHistoryArray = [];

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
        await this.setTag(tagHistoryArray);
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return newTagHistory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
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
        const tagQuery = await queryRunner.manager
          .getRepository(TagEntity)
          .find({
            where: { epc: In(epc) },
          });
        const tagQueryMap = new Map(
          tagQuery.map((query) => [query.epc, query]),
        );
        const newTags = [];
        const newDetections = [];
        for (const tagg of filteredTag) {
          const exists = tagQueryMap.get(tagg.epc);
          if (!exists) {
            const newTag = await queryRunner.manager
              .getRepository(TagEntity)
              .create({
                epc: tagg.epc,
              });
            const newDetection = await queryRunner.manager
              .getRepository(DetectionTagEntity)
              .create({
                tid: tagg.tid,
                detection_quality: tagg.detection_quality,
                tag: newTag,
                tagHistory: tagList.tagHistory,
              });
            newTags.push(newTag);
            newDetections.push(newDetection);
          } else {
            const newDetection = await queryRunner.manager
              .getRepository(DetectionTagEntity)
              .create({
                tid: tagg.tid,
                detection_quality: tagg.detection_quality,
                tag: exists,
                tagHistory: tagList.tagHistory,
              });
            newDetections.push(newDetection);
          }
        }
        if (newTags.length > 0) {
          await queryRunner.manager.getRepository(TagEntity).save(newTags);
        }
        if (newDetections.length > 0) {
          console.log(newDetections);
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
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
}
