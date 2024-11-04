import { Controller, Post, Res, Param, Body, Get } from '@nestjs/common';
import { Response } from 'express';
import { SessionService } from 'src/services/session/session.service';
import { TagService } from 'src/services/tag/tag.service';

@Controller('session')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly tagService: TagService,
  ) {}

  /**
   * API che restituisce tutte le sessioni attive se la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param res
   */
  @Get('active')
  async getAllActiveSession(@Res() res: Response) {
    const actives = await this.sessionService.getAllActiveSession();
    if (actives) {
      const realActive = [];
      for (const active of actives) {
        const last = await this.sessionService.getLastSession(
          active.vehicle_veId,
        );
        if (last) {
          const firstDate = new Date(active.session_period_to);
          const secondDate = new Date(last.period_to);
          if (firstDate >= secondDate) {
            realActive.push(active);
          } else {
            console.log(active.session_id);
          }
        }
      }
      res.status(200).send({
        message: 'Veicoli in movimento con sessione attiva',
        session: realActive,
      });
    } else {
      res.status(404).send({ message: 'No sessioni attive' });
    }
  }
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
   * @param params VeId identificativo Veicolo
   */
  @Get('last/:id')
  async getLastSession(@Res() res: Response, @Param() params: any) {
    const data = await this.sessionService.getLastSession(params.id);
    if (data) res.status(200).send(data);
    else res.status(200).send(`No Session per id: ${params.id}`);
  }

  /**
   * API che restituisce la sessione attiva se, la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param res
   * @param params VeId identificativo Veicolo
   */
  @Get('active/:id')
  async getActiveSessionByVeId(@Res() res: Response, @Param() params: any) {
    const active = await this.sessionService.getActiveSessionByVeId(params.id);
    const last = await this.sessionService.getLastSession(params.id);
    if (!active) {
      res
        .status(200)
        .send(`Nessuna sessione attiva registrata per id: ${params.id}`);
    } else if (!last) {
      res.status(200).send(`No Session per id: ${params.id}`);
    } else {
      const firstDate = new Date(active.period_to);
      const secondDate = new Date(last.period_to);
      if (firstDate > secondDate) {
        res.status(200).send({
          message: 'Veicolo in movimento, sessione attiva',
          session: active,
        });
      } else {
        res.status(404).send({ message: 'Non attivo' });
      }
    }
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
    const data = await this.sessionService.getAllSessionByVeIdRanged(
      params.id,
      dateFrom_new,
      dateTo_new,
    );
    if (data.length > 0) {
      res.status(200).send(data);
    } else res.status(200).send(`No Session per id: ${params.id}`);
  }
  @Post('checkgps/:id')
  async checkSessionGPS(
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
    const datas = await this.sessionService.getAllSessionByVeIdRanged(
      params.id,
      dateFrom_new,
      dateTo_new,
    );
    if (datas.length > 0) {
      let flag: boolean = true;
      const distanceMap = datas.map((data) => data.distance);
      const dataMap = datas.flatMap((data) => data.history);
      const coordinates = dataMap.map((entry) => ({
        latitude: entry.latitude,
        longitude: entry.longitude,
      }));
      if (distanceMap.every((distance) => distance === 0)) {
        flag = true;
      }
      res.status(200).send(coordinates);
    } else res.status(200).send(`No Session per id: ${params.id}`);
  }

  @Get('tagcomparison/:id')
  async getTagComparison(@Res() res: Response, @Param() params: any) {
    try {
      const last_session = await this.sessionService.getLastSession(params.id);
      const last_tag = await this.tagService.getLastTagHistoryByVeId(params.id);
      if (last_session && last_tag) {
        const time_session = new Date(last_session.period_to);
        time_session.setHours(0, 0, 0, 0);
        const time_tag = new Date(last_tag.timestamp);
        time_tag.setHours(0, 0, 0, 0);
        const diff =
          (time_session.getTime() - time_tag.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 0 || diff === 1 || diff === -1) {
          res.status(200).send({ message: 'Tag presente ultima sessione' });
        } else {
          res
            .status(200)
            .send({ message: 'Tag non presente nel ultima sessione' });
        }
      } else if (!last_session) {
        res.status(404).send({ message: 'Ultima sessione non trovata' });
      } else {
        res.status(404).send({ message: 'Ultimo tag non trovato' });
      }
    } catch (error) {
      console.error('Errore nella richiesta al db:', error);
      res.status(500).send('Errore durante la richiesta al db');
    }
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
      console.error('Errore nella richiesta al db:', error);
      res.status(500).send('Errore durante la richiesta al db');
    }
  }
}
