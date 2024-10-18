import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GroupEntity } from 'classes/entities/group.entity';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class GroupService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(GroupEntity, 'mainConnection')
    private readonly groupRepository: Repository<GroupEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}
  // Costruisce la richiesta SOAP
  private buildSoapRequest(methodName: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fwan="http://www.fleetcontrol/FWAN/">
        <soapenv:Header/>
        <soapenv:Body>
          <fwan:${methodName}>
            <suId>${process.env.SUID}</suId>
          </fwan:${methodName}>
        </soapenv:Body>
      </soapenv:Envelope>`;
  }

  // Effettua la richiesta SOAP
  async getGroupList(): Promise<any> {
    const methodName = 'groupList';
    const requestXml = this.buildSoapRequest(methodName);
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
      // Estrarre i dati necessari dall'oggetto JSON risultante
      const lists =
        jsonResult['soapenv:Envelope']['soapenv:Body']['groupListResponse'][
          'list'
        ];

      // Filtra i dati necessari (vgId e vgName)
      const filteredData = lists.map((item: any) => ({
        vgId: item['vgId'],
        vgName: item['vgName'],
      }));

      // Verifica se il gruppo esiste e salva solo quelli nuovi
      const newGroups = [];
      for (const group of filteredData) {
        // const exists = await this.groupRepository.findOne({
        //   where: { vgId: group.vgId },
        // });
        const exists = await queryRunner.manager
          .getRepository(GroupEntity)
          .findOne({
            where: { vgId: group.vgId },
          });
        if (!exists) {
          // const newGroup = this.groupRepository.create({
          //   vgId: group.vgId,
          //   name: group.vgName,
          // });
          const newGroup = queryRunner.manager
            .getRepository(GroupEntity)
            .create({
              vgId: group.vgId,
              name: group.vgName,
            });
          newGroups.push(newGroup);
        }
      }
      // Salva tutti i nuovi gruppi nel database
      if (newGroups.length > 0) {
        await queryRunner.manager.getRepository(GroupEntity).save(newGroups);
        //await this.groupRepository.save(newGroups);
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return newGroups;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }

  async getAllGroups(): Promise<any> {
    const groups = await this.groupRepository.find();
    return groups;
  }

  async getGroupById(id: number): Promise<any> {
    const groups = await this.groupRepository.findOne({
      where: { vgId: id },
    });
    return groups;
  }
}
