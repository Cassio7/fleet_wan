import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { TagService } from 'src/services/tag/tag.service';

@Controller('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post('update/:id')
  async putTagHistory(
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
      const data = await this.tagService.putTagHistory(
        params.id,
        dateFrom_new.toISOString(),
        dateTo_new.toISOString(),
      );
      if (data.length > 0) {
        res.status(200).send(data);
      } else res.status(200).send(`No Tag History per id: ${params.id}`);
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      res.status(500).send('Errore durante la richiesta al servizio SOAP');
    }
  }
}
