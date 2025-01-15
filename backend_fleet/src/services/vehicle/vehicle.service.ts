import { WorksiteDTO } from './../../../classes/dtos/worksite.dto';
import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DeviceEntity } from 'classes/entities/device.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import { convertHours } from 'src/utils/utils';
import { DataSource, In, Repository } from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { VehicleDTO } from 'classes/dtos/vehicle.dto';
import { DeviceDTO } from 'classes/dtos/device.dto';

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

          // Delay di 5 secondi tra i tentativi
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        console.error(
          'Tutti i tentativi di connessione sono falliti, saltato controllo:',
          error.message,
        );
        return false;
      }
    }
    if (!response) return false;
    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

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
        lastSessionEvent: vehicle.lastSessionEvent,
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
      await this.putAllDevice(lists);

      const devices = await queryRunner.manager
        .getRepository(DeviceEntity)
        .find();

      // Troviamo tutti i veicoli esistenti in un'unica query
      const vehicleIds = filteredDataVehicles.map((vehicle) => vehicle.id);
      const existingVehicles = await queryRunner.manager
        .getRepository(VehicleEntity)
        .findBy({ veId: In(vehicleIds) });

      const existingVehicleMap = new Map(
        existingVehicles.map((vehicle) => [vehicle.veId, vehicle]),
      );
      const deviceMap = new Map(
        devices.map((device) => [device.device_id, device]),
      );
      const newVehicles = [];
      const updatedVehicles = [];

      for (const vehicle of filteredDataVehicles) {
        const existingVehicle = existingVehicleMap.get(Number(vehicle.id));

        if (!existingVehicle) {
          // Nuovo veicolo
          const device = deviceMap.get(Number(vehicle.deviceId));
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
              device: device,
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
   * Recupera tutti i veicoli dal database in ordine, viene usata dentro il server
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
  /**
   * Recupera tutti i veicoli dal database in ordine, crea un oggetto DTO da restituire per la chiamata API
   * @returns
   */
  async getAllVehiclesDTO(): Promise<any> {
    const vehicles = await this.vehicleRepository.find({
      relations: {
        device: true,
        worksite: true,
      },
      order: {
        plate: 'ASC',
      },
    });

    return vehicles.map((vehicle) => this.toDTO(vehicle));
  }

  /**
   *
   * @param plateNumber
   * @returns
   */
  async getVehicleByPlate(plateNumber: string) {
    const vehicle = await this.vehicleRepository.findOne({
      where: {
        plate: plateNumber,
      },
      relations: {
        device: true,
        worksite: true,
      },
      order: {
        plate: 'ASC',
      },
    });
    return this.toDTO(vehicle);
  }

  /**
   * Recupera un veicolo in base all VeId passato
   * @param veId VeId
   * @returns
   */
  async getVehicleByVeId(veId: number[] | number): Promise<any> {
    const veIdArray = Array.isArray(veId) ? veId : [veId];
    const vehicles = await this.vehicleRepository.find({
      where: { veId: In(veIdArray) },
      relations: {
        device: true,
        worksite: true,
      },
      order: {
        plate: 'ASC',
      },
    });
    return vehicles.map((vehicle) => this.toDTO(vehicle));
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
      where: { allestimento: true },
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

  private toDTO(vehicle: VehicleEntity): any {
    // Crea VehicleDTO
    const vehicleDTO = new VehicleDTO();
    vehicleDTO.id = vehicle.id;
    vehicleDTO.veId = vehicle.veId;
    vehicleDTO.active = vehicle.active;
    vehicleDTO.plate = vehicle.plate;
    vehicleDTO.model = vehicle.model;
    vehicleDTO.firstEvent = vehicle.firstEvent ?? null;
    vehicleDTO.lastEvent = vehicle.lastEvent ?? null;
    vehicleDTO.lastSessionEvent = vehicle.lastSessionEvent ?? null;
    vehicleDTO.retiredEvent = vehicle.retiredEvent ?? null;
    vehicleDTO.isCan = vehicle.isCan;
    vehicleDTO.isRFIDReader = vehicle.isRFIDReader;
    vehicleDTO.allestimento = vehicle.allestimento ?? null;
    vehicleDTO.relevant_company = vehicle.relevant_company ?? null;
    vehicleDTO.profileId = vehicle.profileId;
    vehicleDTO.profileName = vehicle.profileName;

    // Crea DeviceDTO se esiste il device
    let deviceDTO: DeviceDTO | null = null;
    if (vehicle.device) {
      deviceDTO = new DeviceDTO();
      deviceDTO.device_id = vehicle.device.device_id;
      deviceDTO.type = vehicle.device.type;
      deviceDTO.serial_number = vehicle.device.serial_number;
      deviceDTO.date_build = vehicle.device.date_build;
      deviceDTO.fw_upgrade_disable = vehicle.device.fw_upgrade_disable;
      deviceDTO.fw_id = vehicle.device.fw_id;
      deviceDTO.fw_update = vehicle.device.fw_update ?? null;
      deviceDTO.fw_upgrade_received = vehicle.device.fw_upgrade_received;
      deviceDTO.rtc_battery_fail = vehicle.device.rtc_battery_fail;
      deviceDTO.power_fail_detected = vehicle.device.power_fail_detected;
      deviceDTO.power_on_off_detected = vehicle.device.power_on_off_detected;
    }

    // Crea WorksiteDTO se esiste il worksite
    let worksiteDTO: WorksiteDTO | null = null;
    if (vehicle.worksite) {
      worksiteDTO = new WorksiteDTO();
      worksiteDTO.id = vehicle.worksite.id;
      worksiteDTO.name = vehicle.worksite.name;
    }

    // Restituisci l'oggetto combinato
    return {
      ...vehicleDTO,
      device: deviceDTO,
      worksite: worksiteDTO,
    };
  }
}
