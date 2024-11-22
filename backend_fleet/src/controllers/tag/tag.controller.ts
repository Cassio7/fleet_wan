import { Body, Controller, Param, Post, Res, Get } from '@nestjs/common';
import axios from 'axios';
import { Response } from 'express';
import { TagService } from 'src/services/tag/tag.service';

@Controller('tag')
export class TagController {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
  constructor(private readonly tagService: TagService) {}
  /**
   * API per prendere tutti i tag history in base al VeId
   * @param res
   * @param params VeId
   */
  @Get(':id')
  async getTagHistoryByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const group = await this.tagService.getTagHistoryByVeId(params.id);
      res.status(200).json(group);
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).send('Errore durante il recupero dei realtimes');
    }
  }
  /**
   * API per prendere l'ultimo tag history in base al VeId con posizione risolta
   * @param res
   * @param params VeId
   */
  @Get('last/:id')
  async getLastTagHistoryByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const tagHistory = await this.tagService.getLastTagHistoryByVeId(
        params.id,
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
        res.status(200).json({
          message: 'Nessun Tag History trovato per VeId: ' + params.id,
        });
      }
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).send('Errore durante il recupero dei realtimes');
    }
  }

  /**
   * API per prendere tutti i tag history indicando range temporale in base all'id
   * @param res
   * @param params VeId
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  @Post('ranged/:id')
  async getAllSessionByVeIdRanged(
    @Res() res: Response,
    @Param() params: any,
    @Body() body: any,
  ) {
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;
    // Controlla se dateFrom e dateTo sono forniti
    if (!dateFrom || !dateTo) {
      return res.status(400).send('Date non fornite.');
    }

    // Crea un oggetto Date dalla stringa fornita
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    // Controlla se la data è valida
    if (isNaN(dateFrom_new.getTime()) || isNaN(dateTo_new.getTime())) {
      return res.status(400).send('Formato della data non valido.');
    }
    if (dateFrom_new.getTime() >= dateTo_new.getTime()) {
      // Restituisci un errore se la condizione è vera
      return res
        .status(400)
        .send(
          'La data iniziale deve essere indietro di almeno 1 giorno dalla finale',
        );
    }
    const data = await this.tagService.getTagHistoryByVeIdRanged(
      params.id,
      dateFrom_new,
      dateTo_new,
    );
    if (data.length > 0) {
      res.status(200).send(data);
    } else res.status(200).send(`No TagHistory per id: ${params.id}`);
  }
  /**
   * API per aggiornamento database tag history in base al VeId e ad un range temporale
   * @param res
   * @param params VeId
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  // @Post('update/:id')
  // async putTagHistory(
  //   @Res() res: Response,
  //   @Param() params: any,
  //   @Body() body: any,
  // ) {
  //   try {
  //     const dateFrom = body.dateFrom;
  //     const dateTo = body.dateTo;
  //     // Controlla se dateFrom e dateTo sono forniti
  //     if (!dateFrom || !dateTo) {
  //       return res.status(400).send('Date non fornite.');
  //     }

  //     // Crea un oggetto Date dalla stringa fornita
  //     const dateFrom_new = new Date(dateFrom);
  //     const dateTo_new = new Date(dateTo);

  //     // Controlla se la data è valida
  //     if (isNaN(dateFrom_new.getTime()) || isNaN(dateTo_new.getTime())) {
  //       return res.status(400).send('Formato della data non valido.');
  //     }
  //     if (dateFrom_new.getTime() >= dateTo_new.getTime()) {
  //       // Restituisci un errore se la condizione è vera
  //       return res
  //         .status(400)
  //         .send(
  //           'La data iniziale deve essere indietro di almeno 1 giorno dalla finale',
  //         );
  //     }
  //     const data = await this.tagService.putTagHistory(
  //       params.id,
  //       dateFrom_new.toISOString(),
  //       dateTo_new.toISOString(),
  //     );
  //     if (data.length > 0) {
  //       res.status(200).send(data);
  //     } else res.status(200).send(`No Tag History per id: ${params.id}`);
  //   } catch (error) {
  //     console.error('Errore nella richiesta SOAP:', error);
  //     res.status(500).send('Errore durante la richiesta al servizio SOAP');
  //   }
  // }
}
