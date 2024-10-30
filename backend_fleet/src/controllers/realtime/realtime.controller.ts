import { Controller, Get, Param, Res } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import { RealtimeService } from 'src/services/realtime/realtime.service';

@Controller('realtimes')
export class RealtimeController {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
  constructor(private readonly realTimeService: RealtimeService) {}

  @Get()
  async getAllTimes(@Res() res: Response) {
    try {
      const times = await this.realTimeService.getAllTimes();
      res.status(200).json(times);
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).send('Errore durante il recupero dei realtimes');
    }
  }

  @Get('/:id')
  async getTimeByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const group = await this.realTimeService.getTimesByVeId(params.id);
      res.status(200).json(group);
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).send('Errore durante il recupero dei realtimes');
    }
  }
  /**
   * API che restituisce la via posizione in base alle coordinate
   * @param res VeId del veicolo
   * @param params
   */
  @Get('resolved/:id')
  async getResolvedByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const groups = await this.realTimeService.getTimesByVeId(params.id);
      const response = [];
      for (const group of groups) {
        const pos = await axios.get(this.nominatimUrl, {
          params: {
            lat: group.latitude,
            lon: group.longitude,
            format: 'json',
          },
        });
        response.push(pos.data.display_name);
      }
      res.status(200).json(response);
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).send('Errore durante il recupero dei realtimes');
    }
  }

  @Get('update/:id')
  async getRealTimeList(@Res() res: Response, @Param() params: any) {
    try {
      const data = await this.realTimeService.getRealTimeList(params.id);

      if (data.length > 0) {
        let resultMessage: string = `Gruppo di aggiornamento id : ${params.id}\n\n`;
        for (const item of data) {
          resultMessage += `Aggiornato realtime del veicolo id: ${item.vehicle.veId}, alla posizione  ${item.id}\n `;
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
