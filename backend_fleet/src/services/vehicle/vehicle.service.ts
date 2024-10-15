import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from 'entities/vehicle.entity';
import { Device } from 'entities/device.entity';
import { VehicleGroup } from 'entities/vehicle_group.entity';
import { parseStringPromise } from 'xml2js';
import { createHash } from 'crypto';

@Injectable()
export class VehicleService {
  private serviceUrl = 'https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP';

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(VehicleGroup)
    private readonly vehicleGroupRepository: Repository<VehicleGroup>,
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

    try {
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

      const filteredDataDevices = lists.map((item: any) => {
        const dataToHash = `${item['deviceId']}${item['deviceType']}${item['deviceSN']}${item['deviceBuildDate']}${item['deviceFwUpgradeDisable']}${item['deviceFwId']}${item['deviceLastFwUpdate']}${item['deviceFwUpgradeReceived']}${item['deviceRTCBatteryFailure']}${item['devicePowerFailureDetected']}${item['devicePowerOnOffDetected']}`;

        const hash = createHash('sha256').update(dataToHash).digest('hex');
        return {
          deviceId: item['deviceId'],
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
        const exists = await this.deviceRepository.findOne({
          where: { id: device.deviceId },
        });
        if (!exists) {
          const newDevice = this.deviceRepository.create({
            id: device.deviceId,
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
        await this.deviceRepository.save(newDevices);
      }
      // update devices
      for (const device of filteredDataDevices) {
        const update = await this.deviceRepository.findOne({
          where: { id: device.deviceId, hash: device.hash },
        });
        if (!update) {
          await this.deviceRepository.update(device.deviceId, {
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
          console.log(`Device con ID ${device.deviceId} aggiornato`);
        }
      }

      // add or update vehicles
      const newVehicles = [];
      const newGroups = [];
      for (const vehicle of filteredDataVehicles) {
        const exists = await this.vehicleRepository.findOne({
          where: { veId: vehicle.id },
        });
        const exists_group = await this.vehicleGroupRepository.findOne({
          where: { vg_id: id, ve_id: vehicle.id },
        });
        if (!exists) {
          const newVehicle = this.vehicleRepository.create({
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
            device: vehicle.deviceId,
            hash: vehicle.hash,
          });
          newVehicles.push(newVehicle);
        }
        if (!exists_group) {
          let newGroup: VehicleGroup;
          if (id == 313) {
            newGroup = this.vehicleGroupRepository.create({
              vg_id: id,
              ve_id: vehicle.id,
              primary_group: true,
            });
          } else {
            newGroup = this.vehicleGroupRepository.create({
              vg_id: id,
              ve_id: vehicle.id,
              primary_group: false,
            });
          }
          newGroups.push(newGroup);
        }
      }
      // Salva tutti i nuovi veicoli nel database
      if (newVehicles.length > 0) {
        await this.vehicleRepository.save(newVehicles);
      }

      // Salva tutti i nuovi gruppi veicolo nel database
      if (newGroups.length > 0) {
        await this.vehicleGroupRepository.save(newGroups);
      }

      for (const vehicle of filteredDataVehicles) {
        const update = await this.vehicleRepository.findOne({
          where: { veId: vehicle.id, hash: vehicle.hash },
        });
        if (!update) {
          await this.vehicleRepository.update(vehicle.id, {
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

      return newVehicles;
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      throw new Error('Errore durante la richiesta al servizio SOAP');
    }
  }

  async getAllVehicles(): Promise<any> {
    const vehicles = await this.vehicleRepository.find({
      relations: ['device'],
    });
    return vehicles;
  }

  async getVehicleById(id: number): Promise<any> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { veId: id },
      relations: ['device'],
    });
    return vehicle;
  }

  async getVehiclesByReader(): Promise<any>{
    const vehicles = await this.vehicleRepository.find({
      where: { isRFIDReader: true },
      relations: ['device'],
    });
    return vehicles;
  }
}
