import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';
import { VehicleService } from 'src/services/vehicle/vehicle.service';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  /**
   * Recupera tutti i veicoli listati
   * @param res
   */
  //@UseGuards(AuthGuard)
  @Get()
  async getAllVehicles(@Res() res: Response) {
    try {
      const vehicles = await this.vehicleService.getAllVehicles();
      vehicles.length > 0
        ? res.status(200).json(vehicles)
        : res.status(404).json({ message: 'Nessun veicolo trovato' });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
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
      vehicles.length > 0
        ? res.status(200).json(vehicles)
        : res
            .status(404)
            .json({ message: 'Nessun veicolo RFID reader trovato' });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
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
      vehicles.length > 0
        ? res.status(200).json(vehicles)
        : res
            .status(404)
            .json({ message: 'Nessun veicolo NO RFID reader trovato' });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
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
      vehicles.length > 0
        ? res.status(200).json(vehicles)
        : res.status(404).json({ message: "Nessun veicolo 'can' trovato." });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
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
      vehicles.length > 0
        ? res.status(200).json(vehicles)
        : res
            .status(404)
            .json({ message: "Nessun veicolo non 'can' trovato." });
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
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
      res.status(500).send('Errore durante il recupero del veicolo');
    }
  }

  /**
   * API per ritornare un veicolo in base al veId identificativo del veicolo
   * @param res
   * @param params veId veicolo
   */
  @Get('/:id')
  async getVehicleById(@Res() res: Response, @Param() params: any) {
    try {
      const vehicle = await this.vehicleService.getVehicleById(params.id);
      if (vehicle) {
        res.status(200).json(vehicle);
      } else {
        res.status(404).json({
          message: 'Nessun veicolo con veId: ' + params.id + ' trovato.',
        });
      }
    } catch (error) {
      console.error('Errore nel recupero del veicolo:', error);
      res.status(500).send('Errore durante il recupero del veicolo');
    }
  }

  // @Get('group/:id')
  // async getVehiclesByGroup(@Res() res: Response, @Param() params: any) {
  //   try {
  //     const vehicles = await this.vehicleService.getVehiclesByGroup(params.id);
  //     res.status(200).json(vehicles);
  //   } catch (error) {
  //     console.error('Errore nel recupero dei veicoli:', error);
  //     res.status(500).send('Errore durante il recupero dei veicoli');
  //   }
  // }
}
