import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DeviceEntity } from 'classes/entities/device.entity';
import { GroupEntity } from 'classes/entities/group.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import { convertHours } from 'src/utils/utils';
import { DataSource, In, Repository } from 'typeorm';
import { parseStringPromise } from 'xml2js';

@Injectable()
export class VehicleService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(VehicleEntity, 'readOnlyConnection')
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectRepository(DeviceEntity, 'readOnlyConnection')
    private readonly deviceRepository: Repository<DeviceEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}
  // Prepara la richiesta SOAP
  private buildSoapRequest(methodName, suId, vgId) {
    return `<?xml version="1.0" encoding="UTF-8"?>
  <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:fwan="http://www.fleetcontrol/FWAN/">
      <soapenv:Header/>
      <soapenv:Body>
          <fwan:${methodName}>
          <suId>${suId}</suId>
          <vgId>${vgId}</vgId>
          <timezone>Europe/Rome</timezone>
          <degreeCoords>true</degreeCoords>
          </fwan:${methodName}>
      </soapenv:Body>
  </soapenv:Envelope>`;
  }

  /**
   * Crea richiesta SOAP e inserisce nel database i veicoli e dispositivi con le funzioni sotto
   * @param suId Identificativo società
   * @param vgId Identificativo gruppo
   * @returns
   */
  async getVehicleList(suId: number, vgId: number): Promise<any> {
    const methodName = 'VehiclesListExtended';
    const requestXml = this.buildSoapRequest(methodName, suId, vgId);
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
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        return false; // se item.list non esiste, salto elemento
      }
      const newVehicles = await this.putAllVehicle(lists);
      // const newGroups = [];
      // const groupquery = await queryRunner.manager
      //   .getRepository(GroupEntity)
      //   .findOne({
      //     where: { vgId: vgId },
      //   });
      // // if null
      // if (!groupquery) {
      //   await queryRunner.rollbackTransaction();
      //   await queryRunner.release();
      //   throw new Error(`Gruppo con id ${vgId} non trovato`);
      // }

      // const vehicleIds = lists.map((vehicle) => vehicle.id);
      // const vehicles = await this.vehicleRepository.findBy({
      //   veId: In(vehicleIds),
      // });

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
  /**
   * Inserisce tutti i veicoli nuovi nel database ed aggiorna quelli esistenti
   * @param lists lista dei veicoli
   * @returns
   */
  private async putAllVehicle(lists: any[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    const hashVehicle = (vehicle: any): string => {
      const toHash = {
        id: vehicle.id,
        active: vehicle.active,
        plate: vehicle.plate,
        model: vehicle.model,
        firstEvent: vehicle.firstEvent,
        lastEvent: vehicle.lastEvent,
        isCan: vehicle.isCan,
        isRFIDReader: vehicle.isRFIDReader,
        profileId: vehicle.profileId,
        profileName: vehicle.profileName,
      };
      return createHash('sha256').update(JSON.stringify(toHash)).digest('hex');
    };

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Filtro i dati dei veicoli
      const filteredDataVehicles = lists.map((item: any) => {
        // hash creation
        const hash = hashVehicle(item);
        return {
          id: item['id'],
          active: item['active'] === 'true',
          plate: item['plate'],
          model: item['model'],
          firstEvent:
            typeof item['firstEvent'] === 'object'
              ? null
              : convertHours(item['firstEvent']),
          lastEvent:
            typeof item['lastEvent'] === 'object'
              ? null
              : convertHours(item['lastEvent']),
          lastSessionEvent:
            typeof item['lastSessionEvent'] === 'object'
              ? null
              : convertHours(item['lastSessionEvent']),
          isCan: item['isCan'] === 'true',
          isRFIDReader: item['isRFIDReader'] === 'true',
          profileId: item['profileId'],
          profileName: item['profileName'],
          deviceId: item['deviceId'],
          hash: hash,
        };
      });

      // Inserisci o aggiorna i dispositivi associati
      const newdevice = await this.putAllDevice(lists);

      const deviceIds = newdevice.map((device) => device.device_id);
      const devices1 = await queryRunner.manager
        .getRepository(DeviceEntity)
        .findBy({ device_id: In(deviceIds) });

      // Troviamo tutti i veicoli esistenti in un'unica query
      const vehicleIds = filteredDataVehicles.map((vehicle) => vehicle.id);
      const existingVehicles = await queryRunner.manager
        .getRepository(VehicleEntity)
        .findBy({ veId: In(vehicleIds) });

      const existingVehicleMap = new Map(
        existingVehicles.map((vehicle) => [vehicle.veId, vehicle]),
      );

      let flag = 0;
      const newVehicles = [];
      const updatedVehicles = [];

      for (const vehicle of filteredDataVehicles) {
        const existingVehicle = existingVehicleMap.get(Number(vehicle.id));

        if (!existingVehicle) {
          // Nuovo veicolo
          const newVehicle = queryRunner.manager
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
              device: devices1[flag],
              hash: vehicle.hash,
            });
          newVehicles.push(newVehicle);
        } else if (existingVehicle.hash !== vehicle.hash) {
          // Aggiorniamo il veicolo solo se l'hash è cambiato
          updatedVehicles.push({
            key: existingVehicle.key,
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
            device: existingVehicle.device,
            hash: vehicle.hash,
          });
        }
        flag++;
      }

      // Salva i nuovi veicoli
      if (newVehicles.length > 0) {
        await queryRunner.manager
          .getRepository(VehicleEntity)
          .save(newVehicles);
      }

      // Aggiorna i veicoli esistenti
      if (updatedVehicles.length > 0) {
        for (const vehicle of updatedVehicles) {
          await queryRunner.manager
            .getRepository(VehicleEntity)
            .update({ key: vehicle.key }, vehicle);
        }
      }

      await queryRunner.commitTransaction();
      return newVehicles;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    } finally {
      await queryRunner.release();
    }
  }
  /**
   * Inserisce nel database tutti i Device nuovi e aggiorna quelli già esistenti
   * @param lists lista dei device
   * @returns
   */
  private async putAllDevice(lists: any[]): Promise<any> {
    const queryRunner = this.connection.createQueryRunner();
    const hashDevice = (device: any): string => {
      const toHash = {
        deviceId: device.deviceId,
        device_type: device.deviceType,
        deviceSN: device.deviceSN,
        deviceBuildDate: device.deviceBuildDate,
        deviceFwUpgradeDisable: device.deviceFwUpgradeDisable,
        deviceFwId: device.deviceFwId,
        deviceLastFwUpdate: device.deviceLastFwUpdate,
        deviceFwUpgradeReceived: device.deviceFwUpgradeReceived,
        deviceRTCBatteryFailure: device.deviceRTCBatteryFailure,
        devicePowerFailureDetected: device.devicePowerFailureDetected,
        devicePowerOnOffDetected: device.devicePowerOnOffDetected,
      };
      return createHash('sha256').update(JSON.stringify(toHash)).digest('hex');
    };

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // filtrato
      const filteredDataDevices = lists.map((item: any) => {
        const hash = hashDevice(item);
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
              : convertHours(item['deviceLastFwUpdate']),
          deviceFwUpgradeReceived: item['deviceFwUpgradeReceived'],
          deviceRTCBatteryFailure: item['deviceRTCBatteryFailure'] === 'true',
          devicePowerFailureDetected: item['devicePowerFailureDetected'],
          devicePowerOnOffDetected: item['devicePowerOnOffDetected'],
          hash: hash,
        };
      });

      const deviceIds = filteredDataDevices.map((device) => device.device_id);

      const existingDevices = await queryRunner.manager
        .getRepository(DeviceEntity)
        .findBy({
          device_id: In(deviceIds),
        });

      // Mappa dei dispositivi esistenti
      const existingDeviceMap = new Map(
        existingDevices.map((device) => [device.device_id, device]),
      );

      const newDevices = [];
      const updatedDevices = [];

      for (const device of filteredDataDevices) {
        const existingDevice = existingDeviceMap.get(Number(device.device_id));

        if (!existingDevice) {
          // nuovo
          const newDevice = queryRunner.manager
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
        } else if (existingDevice.hash !== device.hash) {
          updatedDevices.push({
            key: existingDevice.key,
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
        }
      }

      // Inserimento dei nuovi dispositivi
      if (newDevices.length > 0) {
        await queryRunner.manager.getRepository(DeviceEntity).save(newDevices);
      }
      // Aggiorniamo i dispositivi esistenti
      if (updatedDevices.length > 0) {
        for (const device of updatedDevices) {
          console.log(`update Device ID ${device.device_id}`);
          await queryRunner.manager
            .getRepository(DeviceEntity)
            .update({ key: device.key }, device);
          //.update(device.device_id, device);
        }
      }
      await queryRunner.commitTransaction();
      return newDevices;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    } finally {
      await queryRunner.release();
    }
  }
  /**
   * Recupera tutti i veicoli dal database in ordine
   * @returns
   */
  async getAllVehicles(): Promise<any> {
    const vehicles = await this.vehicleRepository.find({
      relations: {
        device: true,
        worksite: true,
      },
      order: {
        id: 'ASC',
      },
    });
    return vehicles;
  }

  async getVehicleByPlate(plateNumber: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: {
        plate: plateNumber,
      },
      relations: {
        device: true,
      },
    });
    return vehicle;
  }

  /**
   * Recupera un veicolo in base all VeId passato
   * @param id VeId
   * @returns
   */
  async getVehicleById(id: number): Promise<any> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { veId: id },
      relations: {
        device: true,
      },
    });
    return vehicle;
  }

  /**
   * Ritorna tutti i veicoli "can", ovvero con l'antenna collegata al contachilometri
   * @returns
   */
  async getCanVehicles(): Promise<any> {
    const vehicles = await this.vehicleRepository.find({
      where: {
        isCan: true,
      },
      relations: {
        device: true,
      },
      order: {
        id: 'ASC',
      },
    });
    return vehicles;
  }

  /**
   * Ritorna tutti i veicoli non "can", ovverocon l'antenna non collegata al contachilometri
   * @returns
   */
  async getNonCanVehicles(): Promise<any> {
    const vehicles = await this.vehicleRepository.find({
      where: {
        isCan: false,
      },
      relations: {
        device: true,
      },
      order: {
        id: 'ASC',
      },
    });
    return vehicles;
  }

  /**
   * Recupera tutti i veicoli che sono RFID Reader in ordine
   * @returns
   */
  async getVehiclesByReader(): Promise<any> {
    const vehicles = await this.vehicleRepository.find({
      where: { isRFIDReader: true },
      relations: {
        device: true,
      },
      order: {
        id: 'ASC',
      },
    });
    return vehicles;
  }

  /**
   * Recupera tutti i veicoli nei quali l'RFID reader è mancante
   * @returns
   */
  async getVehiclesWithNoReader(): Promise<any> {
    const vehicles = await this.vehicleRepository.find({
      where: {
        isRFIDReader: false,
      },
      relations: {
        device: true,
      },
      order: {
        id: 'ASC',
      },
    });
    return vehicles;
  }
  /**
   * Recupera tutti i veicoli appartenenti allo stesso gruppo in base VgId
   * @param id VgId
   * @returns
   */
  // async getVehiclesByGroup(id: number): Promise<any> {
  //   const vehicles = await this.vehicleGroupRepository.find({
  //     where: { group: { vgId: id } },
  //     relations: {
  //       vehicle: true,
  //     },
  //     order: {
  //       id: 'ASC',
  //     },
  //   });
  //   return vehicles;
  // }
  /**
   * Recupera tutti i dispositivi
   * @returns
   */
  async getAllDevice(): Promise<any> {
    const devices = await this.deviceRepository.find({
      order: {
        id: 'ASC',
      },
    });
    return devices;
  }
  /**
   * Recupera il dispositivo in base al device_id
   * @param id device_id
   * @returns
   */
  async getDeviceById(id): Promise<any> {
    const devices = await this.deviceRepository.findOne({
      where: { device_id: id },
    });
    return devices;
  }
}
