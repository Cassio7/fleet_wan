import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { CompanyDTO } from 'classes/dtos/company.dto';
import { DeviceDTO } from 'classes/dtos/device.dto';
import { EquipmentDTO } from 'classes/dtos/equipment.dto';
import { GroupDTO } from 'classes/dtos/group.dto';
import { RentalDTO } from 'classes/dtos/rental.dto';
import { ServiceDTO } from 'classes/dtos/service.dto';
import { VehicleDTO } from 'classes/dtos/vehicle.dto';
import { WorkzoneDTO } from 'classes/dtos/workzone.dto';
import { DeviceEntity } from 'classes/entities/device.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { createHash } from 'crypto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { DataSource, In, Repository } from 'typeorm';
import { parseStringPromise } from 'xml2js';
import { AssociationService } from '../association/association.service';
import { WorksiteDTO } from './../../../classes/dtos/worksite.dto';

@Injectable()
export class VehicleService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(VehicleEntity, 'readOnlyConnection')
    private readonly vehicleRepository: Repository<VehicleEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
    private readonly associationService: AssociationService,
    private readonly notificationsService: NotificationsService,
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
  async getVehicleList(
    suId: number,
    vgId: number,
    first: boolean,
  ): Promise<any> {
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
      const newVehicles = await this.putAllVehicle(lists, first);

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
  private async putAllVehicle(lists: any[], first: boolean): Promise<any> {
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
          plate: item['plate'].trim(),
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
          if (!first) {
            const message = `Nuovo veicolo da censire, targa: ${newVehicle.plate} e veId: ${newVehicle.veId}`;
            await this.notificationsService.createNotification(1, message);
            this.notificationsService.sendNotification(message);
          }
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
              : item['deviceLastFwUpdate'],
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
  async getAllVehicles(): Promise<VehicleEntity[]> {
    const vehicles = await this.vehicleRepository.find({
      relations: {
        worksite: true,
      },
      order: {
        id: 'ASC',
      },
    });
    return vehicles;
  }

  /**
   * Recupera i veicoli per utente admin, prima quelli senza cantiere
   * @returns
   */
  async getAllVehiclesAdmin(): Promise<VehicleDTO[] | null> {
    const vehicles = await this.vehicleRepository.find({
      relations: {
        worksite: {
          group: {
            company: true,
          },
        },
      },
      order: {
        worksite: {
          name: 'DESC',
        },
        plate: 'ASC',
      },
    });
    return vehicles ? vehicles.map((vehicle) => this.toDTO(vehicle)) : null;
  }
  /**
   * Recupera una lista di veicoli in base all utente loggato
   * @param userId id dell utente
   * @returns
   */
  async getAllVehicleByUser(userId: number): Promise<VehicleDTO[] | null> {
    try {
      const veIdArray =
        await this.associationService.getVehiclesRedisAllSet(userId);
      const vehiclesDB = await this.vehicleRepository.find({
        where: { veId: In(veIdArray) },
        relations: {
          device: true,
          worksite: {
            group: {
              company: true,
            },
          },
          workzone: true,
          service: true,
          equipment: true,
          rental: true,
        },
        order: {
          plate: 'ASC',
        },
      });
      return vehiclesDB
        ? vehiclesDB.map((vehicle) => this.toDTO(vehicle))
        : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dei veicoli`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera un veicolo e controlla se utente ha i permessi per accederci
   * @param userId user id
   * @param plateNumber targa del veicolo
   * @returns ritorna un oggetto DTO oppure null
   */
  async getVehicleByPlate(
    userId: number,
    plateNumber: string,
  ): Promise<VehicleDTO | null> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );

    try {
      const vehicle = await this.vehicleRepository.findOne({
        where: {
          plate: plateNumber,
        },
        relations: {
          device: true,
          worksite: true,
        },
      });
      if (!vehicle)
        throw new HttpException('Veicolo non trovato', HttpStatus.NOT_FOUND);
      if (!vehicles.find((v) => v.plate === plateNumber))
        throw new HttpException(
          'Non hai il permesso per visualizzare questo veicolo',
          HttpStatus.FORBIDDEN,
        );
      return vehicle ? this.toDTO(vehicle) : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dei veicoli`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera un veicolo e controlla se utente ha i permessi per accederci
   * @param userId user id
   * @param veId veid veicolo
   * @returns ritorna un oggetto DTO oppure null
   */
  async getVehicleByVeId(
    userId: number,
    veId: number,
  ): Promise<VehicleDTO | null> {
    await this.associationService.getVehiclesRedisAllSet(userId);
    try {
      const vehicle = await this.vehicleRepository.findOne({
        where: {
          veId: veId,
        },
        relations: {
          device: true,
          worksite: {
            group: {
              company: true,
            },
          },
          workzone: true,
          service: true,
          equipment: true,
          rental: true,
        },
      });
      if (!vehicle)
        throw new HttpException('Veicolo non trovato', HttpStatus.NOT_FOUND);
      await this.associationService.checkVehicleAssociateUserSet(userId, veId);
      return vehicle ? this.toDTO(vehicle) : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero del veicolo`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera tutti i veicoli che sono RFID Reader, chiamato solo dentro server
   * @returns
   */
  async getVehiclesByReader(): Promise<VehicleEntity[]> {
    const vehicles = await this.vehicleRepository.find({
      where: { allestimento: true },
      order: {
        id: 'ASC',
      },
    });
    return vehicles;
  }

  /**
   * Dato un veicolo crea il suo ritorno DTO
   * @param vehicle VehicleEntity
   * @returns oggetto formattato
   */
  private toDTO(vehicle: VehicleEntity): any {
    // Crea VehicleDTO
    const vehicleDTO = new VehicleDTO();
    vehicleDTO.id = vehicle.id;
    vehicleDTO.veId = vehicle.veId;
    vehicleDTO.active = vehicle.active;
    vehicleDTO.active_csv = vehicle.active_csv ?? null;
    vehicleDTO.plate = vehicle.plate;
    vehicleDTO.model = vehicle.model;
    vehicleDTO.model_csv = vehicle.model_csv ?? null;
    vehicleDTO.registration = vehicle.registration ?? null;
    vehicleDTO.euro = vehicle.euro ?? null;
    vehicleDTO.firstEvent = vehicle.firstEvent ?? null;
    vehicleDTO.lastEvent = vehicle.lastEvent ?? null;
    vehicleDTO.lastSessionEvent = vehicle.lastSessionEvent ?? null;
    vehicleDTO.isCan = vehicle.isCan;
    vehicleDTO.fleet_number = vehicle.fleet_number ?? null;
    vehicleDTO.fleet_install = vehicle.fleet_install ?? null;
    vehicleDTO.electrical = vehicle.electrical ?? null;
    vehicleDTO.isRFIDReader = vehicle.isRFIDReader;
    vehicleDTO.allestimento = vehicle.allestimento ?? null;
    vehicleDTO.antenna_setting = vehicle.antenna_setting ?? null;
    vehicleDTO.fleet_antenna_number = vehicle.fleet_antenna_number ?? null;
    vehicleDTO.retired_event = vehicle.retired_event ?? null;
    vehicleDTO.worksite_priority = vehicle.worksite_priority ?? null;
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
    let groupDTO: GroupDTO | null = null;
    let companyDTO: CompanyDTO | null = null;
    let workzoneDTO: WorkzoneDTO | null = null;
    let serviceDTO: ServiceDTO | null = null;
    let equipmentDTO: EquipmentDTO | null = null;
    let rentalDTO: RentalDTO | null = null;

    if (vehicle.worksite) {
      if (vehicle.worksite.group) {
        groupDTO = new GroupDTO();
        groupDTO.vgId = vehicle.worksite.group.vgId;
        groupDTO.name = vehicle.worksite.group.name;
      }

      if (vehicle.worksite.group.company) {
        companyDTO = new CompanyDTO();
        companyDTO.suId = vehicle.worksite.group.company.suId;
        companyDTO.name = vehicle.worksite.group.company.name;
      }
    }

    if (vehicle.workzone) {
      workzoneDTO = new WorkzoneDTO();
      workzoneDTO.id = vehicle.workzone.id;
      workzoneDTO.name = vehicle.workzone.name;
    }

    if (vehicle.service) {
      serviceDTO = new ServiceDTO();
      serviceDTO.id = vehicle.service.id;
      serviceDTO.name = vehicle.service.name;
    }

    if (vehicle.equipment) {
      equipmentDTO = new EquipmentDTO();
      equipmentDTO.id = vehicle.equipment.id;
      equipmentDTO.name = vehicle.equipment.name;
    }

    if (vehicle.rental) {
      rentalDTO = new RentalDTO();
      rentalDTO.id = vehicle.rental.id;
      rentalDTO.name = vehicle.rental.name;
    }

    // Restituisci l'oggetto combinato
    return {
      ...vehicleDTO,
      device: deviceDTO,
      worksite: worksiteDTO,
      workzone: workzoneDTO,
      group: groupDTO,
      company: companyDTO,
      service: serviceDTO,
      equipment: equipmentDTO,
      rental: rentalDTO,
    };
  }
}
