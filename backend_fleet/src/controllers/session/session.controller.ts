import { Controller, Post, Res, Param, Body, Get } from '@nestjs/common';
import { Response } from 'express';
import { SessionService } from 'src/services/session/session.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}
  /**
   * API per prendere tutte le sessioni in base all'id
   * @param res
   * @param params
   */
  @Get(':id')
  async getAllSessionByVeId(@Res() res: Response, @Param() params: any) {
    const data = await this.sessionService.getAllSessionByVeId(params.id);
    if (data.length > 0) {
      res.status(200).send(data);
    } else res.status(200).send(`No Session per id: ${params.id}`);
  }
  /**
   * API per prendere l'ultima sessione in base all'id
   * @param res
   * @param params
   */
  @Get('last/:id')
  async getLastSession(@Res() res: Response, @Param() params: any) {
    const data = await this.sessionService.getLastSession(params.id);
    if (data) res.status(200).send(data);
    else res.status(200).send(`No Session per id: ${params.id}`);
  }
  /**
   * API per prendere tutte le distanze delle sessioni in base all'id
   * @param res
   * @param params
   */
  @Get('distance/:id')
  async getDistanceSession(@Res() res: Response, @Param() params: any) {
    const data = await this.sessionService.getDistanceSession(params.id);
    if (data) res.status(200).send(data);
    else res.status(200).send(`No Session per id: ${params.id}`);
  }
  /**
   * API per prendere tutte le sessioni indicando range temporale in base all'id
   * @param res
   * @param params
   * @param body
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
    const data = await this.sessionService.getAllSessionByVeIdRanged(
      params.id,
      dateFrom_new,
      dateTo_new,
    );
    if (data.length > 0) {
      res.status(200).send(data);
    } else res.status(200).send(`No Session per id: ${params.id}`);
  }

  @Post('update/:id')
  async getHistoryList(
    @Res() res: Response,
    @Param() params: any,
    @Body() body: any,
  ) {
    try {
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
      const data = await this.sessionService.getSessionist(
        params.id,
        dateFrom_new.toISOString(),
        dateTo_new.toISOString(),
      );

      if (data.length > 0) {
        // let resultMessage: string = `Aggiornata history del veicolo: ${params.id}, dal giorno ${dateFrom} al giorno ${dateTo}.\n\n`;
        // for (const item of data) {
        //   resultMessage += `History inserito del: ${item.timestamp}\n `;
        // }
        // res.status(200).send(resultMessage);
        res.status(200).send(data);
      } else if (data === false) {
        res.status(200).send(`No History per veicolo con id: ${params.id}\n`);
      } else {
        res.status(200).send('Nessun aggiornamento');
      }
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      res.status(500).send('Errore durante la richiesta al servizio SOAP');
    }
  }
}
