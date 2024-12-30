import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { AssociationService } from 'src/services/association/association.service';
import { VehicleService } from 'src/services/vehicle/vehicle.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('vehicles')
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
export class VehicleController {
  constructor(
    private readonly associationService: AssociationService,
    private readonly vehicleService: VehicleService,
  ) {}

  /**
   * Ritorna tutti i veicoli in base all utente token utente che fa la richiesta
   * @param req User token
   * @param res
   * @returns
   */
  @Get()
  async getAllVehicles(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    try {
      const vehicles = (await this.associationService.getVehiclesByUserRole(
        req.user.id,
      )) as VehicleEntity[];
      if (!vehicles || vehicles.length === 0) {
        return res.status(404).json({ message: 'Nessun Veicolo associato' });
      }
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const vehiclesOutput =
        await this.vehicleService.getVehicleByVeId(vehicleIds);
      if (vehiclesOutput.length > 0) res.status(200).json(vehiclesOutput);
      else res.status(404).json({ message: 'Nessun veicolo trovato' });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res
        .status(500)
        .json({ message: 'Errore durante il recupero dei veicoli' });
    }
  }

  /**
   * Ritorna tutti i veicoli dove l'RFID reader è stato montato
   * @param res
   */
  @Get('reader')
  async getVehiclesByReader(@Res() res: Response) {
    try {
      const vehicles = await this.vehicleService.getVehiclesByReader();
      if (vehicles.length > 0) res.status(200).json(vehicles);
      else
        res.status(404).json({ message: 'Nessun veicolo RFID reader trovato' });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res
        .status(500)
        .json({ message: 'Errore durante il recupero dei veicoli' });
    }
  }

  /**
   * Ritorna tutti i veicoli dove l'RFID reader NON è stato montato
   * @param res
   */
  @Get('noreader')
  async getVehiclesWithNoReader(@Res() res: Response) {
    try {
      const vehicles = await this.vehicleService.getVehiclesWithNoReader();
      if (vehicles.length > 0) res.status(200).json(vehicles);
      else
        res
          .status(404)
          .json({ message: 'Nessun veicolo NO RFID reader trovato' });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res
        .status(500)
        .json({ message: 'Errore durante il recupero dei veicoli' });
    }
  }

  /**
   * Ritorna tutti i veicoli "can", ovvero con l'antenna collegata al contachilometri
   * @param res
   */
  @Get('can')
  async getCanVehicles(@Res() res: Response) {
    try {
      const vehicles = await this.vehicleService.getCanVehicles();
      if (vehicles.length > 0) res.status(200).json(vehicles);
      else res.status(404).json({ message: "Nessun veicolo 'can' trovato." });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res
        .status(500)
        .json({ message: 'Errore durante il recupero dei veicoli' });
    }
  }

  /**
   * Ritorna tutti i veicoli non "can", ovvero con l'antenna non collegata al contachilometri
   * @param res
   */
  @Get('nocan')
  async getNonCanVehicles(@Res() res: Response) {
    try {
      const vehicles = await this.vehicleService.getNonCanVehicles();
      if (vehicles.length > 0) res.status(200).json(vehicles);
      else
        res.status(404).json({ message: "Nessun veicolo non 'can' trovato." });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res
        .status(500)
        .json({ message: 'Errore durante il recupero dei veicoli' });
    }
  }

  /**
   * API che restituisce un veicolo in base alla targa inserita
   * @param res
   * @param body
   */
  @Post('plate')
  async getVehicleByPlate(@Res() res: Response, @Body() body: any) {
    try {
      const plateNumber = body.plate;
      const vehicle = await this.vehicleService.getVehicleByPlate(plateNumber);

      if (vehicle) {
        res.status(200).json(vehicle);
      } else {
        res.status(404).json({
          message: `Veicolo con targa: ${plateNumber} non trovato.`,
        });
      }
    } catch (error) {
      console.error('Errore nel recupero del veicolo:', error);
      res
        .status(500)
        .json({ message: 'Errore durante il recupero del veicolo' });
    }
  }

  /**
   *  API per ritornare un veicolo in base al veId identificativo del veicolo
   * @param req Utente token per controllo permessi
   * @param res
   * @param params VeId identificativo veicoli
   * @returns
   */
  @Get('/:veId')
  async getVehicleById(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param() params: any,
  ) {
    try {
      const vehicles = (await this.associationService.getVehiclesByUserRole(
        req.user.id,
      )) as VehicleEntity[];

      if (!vehicles || !Array.isArray(vehicles)) {
        return res.status(404).json({ message: 'Nessun Veicolo associato' });
      }
      const vehicle = await this.vehicleService.getVehicleByVeId([params.veId]);
      if (!vehicle || vehicle.length === 0) {
        return res.status(404).json({
          message: 'Nessun veicolo con veId: ' + params.veId + ' trovato.',
        });
      }

      const vehicleCheck = vehicles.find(
        (element) => element.veId === Number(params.veId),
      );

      if (!vehicleCheck) {
        return res.status(404).json({
          message: `Non hai i permessi per visualizzare il veicolo con VeId: ${params.veId}`,
        });
      }

      res.status(200).json(vehicle);
    } catch (error) {
      console.error('Errore nel recupero del veicolo:', error);
      res
        .status(500)
        .json({ message: 'Errore durante il recupero del veicolo' });
    }
  }
}
