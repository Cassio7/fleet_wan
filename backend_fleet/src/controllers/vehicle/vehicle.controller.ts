import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { VehicleService } from 'src/services/vehicle/vehicle.service';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  async getAllVehicles(@Res() res: Response) {
    try {
      const groups = await this.vehicleService.getAllVehicles();
      res.status(200).json(groups);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }

  @Get('/reader')
  async getVehiclesByReader(@Res() res: Response) {
    try {
      const groups = await this.vehicleService.getVehiclesByReader();
      res.status(200).json(groups);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }

  @Get('/:id')
  async getVehicleById(@Res() res: Response, @Param() params: any) {
    try {
      const group = await this.vehicleService.getVehicleById(params.id);
      res.status(200).json(group);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }

  @Get('group/:id')
  async getVehiclesByGroup(@Res() res: Response, @Param() params: any) {
    try {
      const vehicles = await this.vehicleService.getVehiclesByGroup(params.id);
      res.status(200).json(vehicles);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }

  @Get('/update/:id')
  async getVehicleList(@Res() res: Response, @Param() params: any) {
    try {
      const data = await this.vehicleService.getVehicleList(params.id);

      if (data.length > 0) {
        let resultMessage: string = `Gruppo di aggiornamento id : ${params.id}\n\n`;
        for (const item of data) {
          resultMessage += `Aggiornati Veicolo id: ${item.veId}\n `;
        }
        res.status(200).send(resultMessage);
      } else {
        res.status(200).send('Nessun aggiornamento');
      }
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      res.status(500).send('Errore durante la richiesta al servizio SOAP');
    }
  }
}
