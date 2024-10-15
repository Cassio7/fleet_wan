import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { RealtimeService } from 'src/services/realtime/realtime.service';

@Controller('realtimes')
export class RealtimeController {
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

  // @Get('/:id')
  // async getGroupById(@Res() res: Response, @Param() params: any) {
  //   try {
  //     const group = await this.realTimeService.getTimesByVeId(params.id);
  //     res.status(200).json(group);
  //   } catch (error) {
  //     console.error('Errore nel recupero dei realtimes:', error);
  //     res.status(500).send('Errore durante il recupero dei realtimes');
  //   }
  // }

  @Get('update/:id')
  async getRealTimeList(@Res() res: Response, @Param() params: any) {
    try {
      const data = await this.realTimeService.getRealTimeList(params.id);

      if (data.length > 0) {
        let resultMessage: string = `Gruppo di aggiornamento id : ${params.id}\n\n`;
        for (const item of data) {
          resultMessage += `Aggiornato realtime del veicolo id: ${item.veId}, alla posizione  ${item.id}\n `;
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
