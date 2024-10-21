import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DeviceEntity } from 'classes/entities/device.entity';
import { GroupEntity } from 'classes/entities/group.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { VehicleGroupEntity } from 'classes/entities/vehicle_group.entity';
import { createHash } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class VehicleService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(VehicleEntity, 'mainConnection')
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(DeviceEntity, 'mainConnection')
    private readonly deviceRepository: Repository<DeviceEntity>,
    @InjectRepository(VehicleGroupEntity, 'mainConnection')
    private readonly vehicleGroupRepository: Repository<VehicleGroupEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}
  // Prepara la richiesta SOAP
  private buildSoapRequest(methodName, id) {
    return `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fwan="http://www.fleetcontrol/FWAN/">
      <soapenv:Header/>
      <soapenv:Body>
          <fwan:${methodName}>
          <suId>${process.env.SUID}</suId>
          <vgId>${id}</vgId>
          <timezone>Europe/Rome</timezone>
          <degreeCoords>true</degreeCoords>
          </fwan:${methodName}>
      </soapenv:Body>
  </soapenv:Envelope>`;
  }

  // SOAP
  async getVehicleList(id: number): Promise<any> {
    const methodName = 'VehiclesListExtended';
    const requestXml = this.buildSoapRequest(methodName, id);
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
          'vehiclesListExtendedResponse'
        ]['list'];

      if (!lists) {
        return false; // se item.list non esiste, salto elemento
      }
      const newVehicles = await this.putAllVehicle(lists);
      const newGroups = [];
      const groupquery = await queryRunner.manager
        .getRepository(GroupEntity)
        .findOne({
          where: { vgId: id },
        });
      // if null
      if (!groupquery) {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        throw new Error(`Gruppo con id ${id} non trovato`);
      }
      for (const vehicle of newVehicles) {
        const exists_group = await this.vehicleGroupRepository.findOne({
          where: { vgId: id, veId: vehicle.veId },
        });
        if (!exists_group) {
          const vehiclequery = await this.vehicleRepository.findOne({
            where: { veId: vehicle.veId },
          });
          const newGroup = await queryRunner.manager
            .getRepository(VehicleGroupEntity)
            .create({
              group: groupquery,
              vehicle: vehiclequery,
            });
          newGroups.push(newGroup);
        }
      }
      // Salva tutti i nuovi gruppi veicolo nel database
      if (newGroups.length > 0) {
        await queryRunner.manager
          .getRepository(VehicleGroupEntity)
          .save(newGroups);
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return newVehicles;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }

  async getAllVehicles(): Promise<any> {
    const vehicles = await this.vehicleRepository.find({
      relations: {
        device: true,
      },
    });
    return vehicles;
  }

  async getVehicleById(id: number): Promise<any> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { veId: id },
      relations: {
        device: true,
      },
    });
    return vehicle;
  }

  async getVehiclesByReader(): Promise<any> {
    const vehicles = await this.vehicleRepository.find({
      where: { isRFIDReader: true },
      relations: {
        device: true,
      },
    });
    return vehicles;
  }

  async getVehiclesByGroup(id: number): Promise<any> {
    const vehicles = await this.vehicleGroupRepository.find({
      where: { group: { vgId: id } },
      select: ['veId'],
      relations: {
        vehicle: true,
      },
    });
    return vehicles;
  }

  async getAllDevice(): Promise<any> {
    const devices = await this.deviceRepository.find();
    return devices;
  }

  private async putAllDevice(lists: any[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const filteredDataDevices = lists.map((item: any) => {
        const dataToHash = `${item['deviceId']}${item['deviceType']}${item['deviceSN']}${item['deviceBuildDate']}${item['deviceFwUpgradeDisable']}${item['deviceFwId']}${item['deviceLastFwUpdate']}${item['deviceFwUpgradeReceived']}${item['deviceRTCBatteryFailure']}${item['devicePowerFailureDetected']}${item['devicePowerOnOffDetected']}`;

        const hash = createHash('sha256').update(dataToHash).digest('hex');
        return {
          device_id: item['deviceId'],
          deviceType: item['deviceType'],
          deviceSN: item['deviceSN'],
          deviceBuildDate: item['deviceBuildDate'],
          deviceFwUpgradeDisable: item['deviceFwUpgradeDisable'] === 'true',
          deviceFwId: item['deviceFwId'],
          deviceLastFwUpdate:
            typeof item['deviceLastFwUpdate'] === 'object'
              ? null
              : item['deviceLastFwUpdate'],
          deviceFwUpgradeReceived: item['deviceFwUpgradeReceived'],
          deviceRTCBatteryFailure: item['deviceRTCBatteryFailure'] === 'true',
          devicePowerFailureDetected: item['devicePowerFailureDetected'],
          devicePowerOnOffDetected: item['devicePowerOnOffDetected'],
          hash: hash, // Aggiungi l'hash come nuovo campo
        };
      });
      // add device
      const newDevices = [];
      for (const device of filteredDataDevices) {
        const exists = await queryRunner.manager
          .getRepository(DeviceEntity)
          .findOne({
            where: { device_id: device.device_id },
          });
        if (!exists) {
          const newDevice = await queryRunner.manager
            .getRepository(DeviceEntity)
            .create({
              device_id: device.device_id,
              type: device.deviceType,
              serial_number: device.deviceSN,
              date_build: device.deviceBuildDate,
              fw_upgrade_disable: device.deviceFwUpgradeDisable,
              fw_id: device.deviceFwId,
              fw_update: device.deviceLastFwUpdate,
              fw_upgrade_received: device.deviceFwUpgradeReceived,
              rtc_battery_fail: device.deviceRTCBatteryFailure,
              power_fail_detected: device.devicePowerFailureDetected,
              power_on_off_detected: device.devicePowerOnOffDetected,
              hash: device.hash,
            });
          newDevices.push(newDevice);
        }
      }
      // save new devices
      if (newDevices.length > 0) {
        await queryRunner.manager.getRepository(DeviceEntity).save(newDevices);
      }
      // update devices
      for (const device of filteredDataDevices) {
        const update = await this.deviceRepository.findOne({
          where: { device_id: device.device_id },
        });
        if (update && update.hash !== device.hash) {
          await queryRunner.manager
            .getRepository(DeviceEntity)
            .update(device.device_id, {
              type: device.deviceType,
              serial_number: device.deviceSN,
              date_build: device.deviceBuildDate,
              fw_upgrade_disable: device.deviceFwUpgradeDisable,
              fw_id: device.deviceFwId,
              fw_update: device.deviceLastFwUpdate,
              fw_upgrade_received: device.deviceFwUpgradeReceived,
              rtc_battery_fail: device.deviceRTCBatteryFailure,
              power_fail_detected: device.devicePowerFailureDetected,
              power_on_off_detected: device.devicePowerOnOffDetected,
              hash: device.hash,
            });
          console.log(`Device con ID ${device.device_id} aggiornato`);
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
  private async putAllVehicle(lists: any[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const filteredDataVehicles = lists.map((item: any) => {
        // hash data
        const dataToHash = `${item['id']}${item['active']}${item['plate']}${item['model']}${item['firstEvent']}${item['lastEvent']}${item['isCan']}${item['isRFIDReader']}${item['profileId']}${item['profileName']}`;

        // hash creation
        const hash = createHash('sha256').update(dataToHash).digest('hex');

        return {
          id: item['id'],
          active: item['active'] === 'true',
          plate: item['plate'],
          model: item['model'],
          firstEvent:
            typeof item['firstEvent'] === 'object' ? null : item['firstEvent'],
          lastEvent:
            typeof item['lastEvent'] === 'object' ? null : item['lastEvent'],
          lastSessionEvent:
            typeof item['lastSessionEvent'] === 'object'
              ? null
              : item['lastSessionEvent'],
          isCan: item['isCan'] === 'true',
          isRFIDReader: item['isRFIDReader'] === 'true',
          profileId: item['profileId'],
          profileName: item['profileName'],
          deviceId: item['deviceId'],
          hash: hash,
        };
      });
      await this.putAllDevice(lists);

      const devices = await this.getAllDevice();
      let flag: number = 0;
      // add or update vehicles
      const newVehicles = [];
      for (const vehicle of filteredDataVehicles) {
        const exists = await this.vehicleRepository.findOne({
          where: { veId: vehicle.id },
        });
        if (!exists) {
          const newVehicle = await queryRunner.manager
            .getRepository(VehicleEntity)
            .create({
              veId: vehicle.id,
              active: vehicle.active,
              plate: vehicle.plate,
              model: vehicle.model,
              firstEvent: vehicle.firstEvent,
              lastEvent: vehicle.lastEvent,
              lastSessionEvent: vehicle.lastSessionEvent,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.isRFIDReader,
              profileId: vehicle.profileId,
              profileName: vehicle.profileName,
              device_id: devices[flag],
              hash: vehicle.hash,
            });
          flag++;
          newVehicles.push(newVehicle);
        }
      }
      // Salva tutti i nuovi veicoli nel database
      if (newVehicles.length > 0) {
        await queryRunner.manager
          .getRepository(VehicleEntity)
          .save(newVehicles);
      }

      // update vehicles
      for (const vehicle of filteredDataVehicles) {
        const update = await this.vehicleRepository.findOne({
          where: { veId: vehicle.id },
        });
        if (update && update.hash !== vehicle.hash) {
          await queryRunner.manager
            .getRepository(VehicleEntity)
            .update(vehicle.id, {
              active: vehicle.active,
              plate: vehicle.plate,
              model: vehicle.model,
              firstEvent: vehicle.firstEvent,
              lastEvent: vehicle.lastEvent,
              lastSessionEvent: vehicle.lastSessionEvent,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.isRFIDReader,
              profileId: vehicle.profileId,
              profileName: vehicle.profileName,
              device: vehicle.deviceId,
              hash: vehicle.hash,
            });
        }
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return newVehicles;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }
}
