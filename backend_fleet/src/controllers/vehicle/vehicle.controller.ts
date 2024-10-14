import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { VehicleService } from 'src/services/vehicle/vehicle.service';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}
  @Get('update/:id')
  async getVehicleList(@Res() res: Response, @Param() params: any) {
    try {
      const data = await this.vehicleService.getVehicleList(params.id);
      res.status(200).json(data);
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      res.status(500).send('Errore durante la richiesta al servizio SOAP');
    }
  }
}
