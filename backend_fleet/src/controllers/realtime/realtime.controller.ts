import { Controller, Get, Param, Res } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import { CompanyService } from 'src/services/company/company.service';
import { RealtimeService } from 'src/services/realtime/realtime.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Controller('realtimes')
export class RealtimeController {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
  constructor(
    private readonly realTimeService: RealtimeService,
    private readonly companyService: CompanyService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Recupera tutti i realtimes di tutti i veicoli salvati
   * @param res
   */
  @Get()
  async getAllTimes(@Res() res: Response) {
    try {
      const times = await this.realTimeService.getAllTimes();
      if (times) res.status(200).json(times);
      else
        res.status(404).json({
          message: 'Nessun realtime recuperato',
        });
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).send('Errore durante il recupero dei realtimes');
    }
  }

  /**
   * Recupera i realtime in base al veId
   * @param res
   * @param params veId Identificativo del veicolo
   */
  @Get('/:veId')
  async getTimeByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const times = await this.realTimeService.getTimesByVeId(params.veId);
      if (times) res.status(200).json(times);
      else
        res.status(404).json({
          message: 'Nessun realtime recuperato per Veicolo: ' + params.veId,
        });
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).json({ message: 'Errore nel recupero dei realtimes' });
    }
  }

  /**
   * API che restituisce la via posizione in base alle coordinate salvandola in cache su Redis
   * @param res VeId del veicolo
   * @param params
   */
  @Get('resolved/:veId')
  async getResolvedByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const times = await this.realTimeService.getTimesByVeId(params.veId);
      const response = [];
      for (const time of times) {
        const cacheKey = `pos:${time.latitude}:${time.longitude}`;
        let position = await this.redis.get(cacheKey);
        if (!position) {
          const pos = await axios.get(this.nominatimUrl, {
            params: {
              lat: time.latitude,
              lon: time.longitude,
              format: 'json',
            },
          });
          position = pos.data.display_name;
          await this.redis.set(cacheKey, position, 'EX', 86400);
        }

        response.push(position);
      }
      if (response.length > 0) res.status(200).json(response);
      else res.status(404).json({ message: 'Nessuna posizione registrata' });
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res
        .status(500)
        .json({ message: 'Errore durante il recupero dei realtimes' });
    }
  }

  /**
   * Fa una chiamata al servizio SOAP per recuperare i realtimes in base al vgId
   * @param res
   * @param params vgId identificativo del gruppo
   */
  @Get('update/:vgId')
  async getRealTimeList(@Res() res: Response, @Param() params: any) {
    try {
      const company = await this.companyService.getCompanyByVgId(params.vgId);
      const data = await this.realTimeService.getRealTimeList(
        company.suId,
        params.vgId,
      );
      if (data) {
        res
          .status(200)
          .json({ message: `Aggiornato il gruppo: ${company.group[0].name}` });
      } else {
        res.status(404).json({ message: 'Nessun aggiornamento' });
      }
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      res
        .status(500)
        .json({ message: 'Errore durante la richiesta al servizio SOAP' });
    }
  }
}
