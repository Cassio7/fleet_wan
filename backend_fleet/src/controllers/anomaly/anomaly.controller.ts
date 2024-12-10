import { AnomalyService } from './../../services/anomaly/anomaly.service';
import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('anomaly')
export class AnomalyController {
  constructor(private readonly anomalyService: AnomalyService) {}

  /**
   * Ritorna tutte le anomalie salvate 
   * @param res oggetto costruito in modo soltanto con le informazioni necessarie
   */
  @Get()
  async getAllAnomaly(@Res() res: Response) {
    const datas = await this.anomalyService.getAllAnomaly();
    if (datas) {
      const vehicles = [];
      datas.forEach((data) => {
        vehicles.push({
          plate: data.vehicle.plate,
          veId: data.vehicle.veId,
          isCan: data.vehicle.isCan,
          isRFIDReader: data.vehicle.isRFIDReader,
          anomaliaSessione: data.session || null,
          session: {
            date: data.day,
            anomalies: {
              Antenna: data.antenna || null,
              GPS: data.gps || null,
            },
          },
        });
      });
      res.status(200).json(vehicles);
    } else {
      res.status(404).json({ message: 'No data' });
    }
  }

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
