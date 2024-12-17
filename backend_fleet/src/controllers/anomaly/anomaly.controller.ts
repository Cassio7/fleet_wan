import { AssociationService } from './../../services/association/association.service';
import { Role } from 'classes/enum/role.enum';
import { AnomalyService } from './../../services/anomaly/anomaly.service';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { VehicleEntity } from 'classes/entities/vehicle.entity';

@UseGuards(AuthGuard, RolesGuard)
@Controller('anomaly')
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
export class AnomalyController {
  constructor(
    private readonly anomalyService: AnomalyService,
    private readonly associationService: AssociationService,
  ) {}

  /**
   * Ritorna tutte le anomalie salvate
   * @param res oggetto costruito soltanto con le informazioni necessarie
   */
  @Get()
  async getAllAnomaly(
    // Necessario per recuperare user dalla richiesta e non dare errore in compilazione
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const vehicles = await this.associationService.getVehiclesByUserRole(
      req.user.id,
    );
    if (vehicles) {
      const vehicleIds = vehicles.map(
        (vehicle) => (vehicle as VehicleEntity).veId,
      );
      const datas = await this.anomalyService.getAllAnomaly(vehicleIds);
      if (datas.length > 0) {
        const vehicleMap = new Map();

        datas.forEach((data) => {
          const veId = data.vehicle.veId;

          if (!vehicleMap.has(veId)) {
            // First time seeing this vehicle, create initial entry
            vehicleMap.set(veId, {
              plate: data.vehicle.plate,
              veId: data.vehicle.veId,
              isCan: data.vehicle.isCan,
              anomaliaSessione: data.session || null,
              isRFIDReader: data.vehicle.isRFIDReader,
              sessions: [],
            });
          }

          // Add session to the vehicle's sessions
          const vehicle = vehicleMap.get(veId);
          vehicle.sessions.push({
            date: data.date,
            anomalies: {
              Antenna: data.antenna || null,
              GPS: data.gps || null,
            },
          });
        });

        // Convert map to array
        const vehicles = Array.from(vehicleMap.values());

        res.status(200).json(vehicles);
      } else {
        res.status(404).json({ message: 'Nessuna anomalia trovata' });
      }
    } else
      res.status(404).json({ message: 'Nessuna veicolo associato al utente' });
  }
  /**
   * API per i controlli dei mezzi in base al range temporale
   * @param res
   * @param body
   */
  @Post('checkerrors')
  async checkErrors(@Res() res: Response, @Body() body) {
    const data = await this.anomalyService.checkErrors(
      body.dateFrom,
      body.dateTo,
    );
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ message: 'No data' });
    }
  }
}
