import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RealtimeDTO } from 'classes/dtos/realtime.dto';
import { VehicleDTO } from 'classes/dtos/vehicle.dto';
import { VehicleEntity } from 'classes/entities/vehicle.entity';

import { WorksiteDTO } from 'classes/dtos/worksite.dto';
import { AssociationService } from '../association/association.service';
import { SessionService } from '../session/session.service';

interface RealtimeData {
  vehicle: VehicleDTO & {
    worksite: WorksiteDTO;
  };
  realtime: RealtimeDTO;
}
@Injectable()
export class RealtimeService {
  constructor(
    private readonly associationService: AssociationService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Recupera l'ultima posizione registrata di un veicolo e crea un array di oggetti di ritorno
   * @param userId id utente
   * @returns
   */
  async getLastRealtimeHistory(userId: number): Promise<RealtimeData[]> {
    const vehicles =
      await this.associationService.getVehiclesAssociateUserRedis(userId);
    if (!vehicles || vehicles.length === 0)
      throw new HttpException(
        'Nessun veicolo associato per questo utente',
        HttpStatus.NOT_FOUND,
      );
    const vehicleIds = vehicles.map((v) => v.veId);

    let historyMap = await this.sessionService.getLastHistoryRedis(vehicleIds);
    if (!historyMap || historyMap.size === 0)
      historyMap = await this.sessionService.getLastHistoryByVeIds(vehicleIds);
    const realtimeData = vehicles
      .filter((vehicle) => historyMap.has(vehicle.veId))
      .map((vehicle) => {
        const realtime = historyMap.get(vehicle.veId);
        return {
          vehicle,
          realtime,
        };
      });
    return realtimeData.map((data) => this.toDTO(data.vehicle, data.realtime));
  }

  /**
   * Crea oggetto DTO
   * @param vehicle Veicolo passato
   * @param realtime dati per il realtime da estrapolare
   * @returns
   */
  private toDTO(vehicle: VehicleEntity, realtime: any): RealtimeData {
    const vehicleDTO = new VehicleDTO();
    vehicleDTO.plate = vehicle.plate;
    vehicleDTO.veId = vehicle.veId;
    const worksiteDTO = new WorksiteDTO();
    worksiteDTO.id = vehicle?.worksite?.id || null;
    worksiteDTO.name = vehicle?.worksite?.name || null;
    const realtimeDTO = new RealtimeDTO();
    realtimeDTO.timestamp = realtime.timestamp;
    realtimeDTO.latitude = realtime.latitude;
    realtimeDTO.longitude = realtime.longitude;

    return {
      vehicle: { ...vehicleDTO, worksite: worksiteDTO },
      realtime: realtimeDTO,
    };
  }
}
