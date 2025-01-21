import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { TagService } from 'src/services/tag/tag.service';
import { validateDateRange } from 'src/utils/utils';

@Controller('tag')
export class TagController {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
  constructor(private readonly tagService: TagService) {}
  /**
   * API per prendere tutti i tag history in base al VeId
   * @param res
   * @param params VeId
   */
  @Get(':veId')
  async getTagHistoryByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const tags = await this.tagService.getTagHistoryByVeId(params.veId);
      if (tags.length > 0) res.status(200).json(tags);
      else
        res.status(404).json({
          message: 'Nessun Tag trovato per Veicolo veId: ' + params.veId,
        });
    } catch (error) {
      console.error('Errore durante il recupero dei Tag:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei Tag' });
    }
  }
  /**
   * API per prendere l'ultimo tag history in base al VeId con posizione risolta
   * @param res
   * @param params VeId
   */
  @Get('last/:veId')
  async getLastTagHistoryByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const tagHistory = await this.tagService.getLastTagHistoryByVeId(
        params.veId,
      );
      if (tagHistory) {
        // const pos = await axios.get(this.nominatimUrl, {
        //   params: {
        //     lat: tagHistory.latitude,
        //     lon: tagHistory.longitude,
        //     format: 'json',
        //   },
        // });
        //res.status(200).json({ tagHistory, posizione: pos.data.address });
        res.status(200).json(tagHistory);
      } else {
        res.status(404).json({
          message: 'Nessun Tag History trovato per VeId: ' + params.veId,
        });
      }
    } catch (error) {
      console.error('Errore durante il recupero del Tag:', error);
      res.status(500).json({ message: 'Errore durante il recupero del Tag' });
    }
  }

  /**
   * API per prendere tutti i tag history indicando range temporale in base all'id
   * @param res
   * @param params VeId
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  @Post('ranged/:veId')
  async getTagHistoryByVeIdRanged(
    @Res() res: Response,
    @Param() params: any,
    @Body() body: any,
  ) {
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;

    // controllo data valida
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);
    try {
      const data = await this.tagService.getTagHistoryByVeIdRanged(
        params.veId,
        dateFrom_new,
        dateTo_new,
      );
      if (data.length > 0) {
        res.status(200).json(data);
      } else
        res
          .status(404)
          .json({ message: `No TagHistory per id: ${params.veId}` });
    } catch (error) {
      console.error('Errore durante il recupero dei Tag:', error);
      res.status(500).json({ message: 'Errore durante il recupero dei Tag' });
    }
  }
  /**
   *
   * @param res
   * @param params
   */
  @Get('detection/:veId')
  async getDetectionQualityBiVeId(@Res() res: Response, @Param() params: any) {
    try {
      const detections = await this.tagService.getDetectionQualityBiVeId(
        params.veId,
      );
      if (detections.length > 0) res.status(200).json(detections);
      else
        res.status(404).json({
          message: 'Nessuna lettura per il Veicolo con veId: ' + params.veId,
        });
    } catch (error) {
      console.error('Errore nel recupero delle letture dei tag:', error);
      res
        .status(500)
        .json({ message: 'Errore nel recupero delle letture dei tag.' });
    }
  }
}
