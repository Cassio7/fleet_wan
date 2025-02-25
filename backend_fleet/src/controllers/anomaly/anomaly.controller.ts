import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Request, Response } from 'express';
import Redis from 'ioredis';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { ControlService } from 'src/services/control/control.service';
import { AnomalyService } from './../../services/anomaly/anomaly.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('anomaly')
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
export class AnomalyController {
  constructor(
    private readonly anomalyService: AnomalyService,
    @InjectRedis() private readonly redis: Redis,
    private readonly loggerService: LoggerService,
    private readonly controlService: ControlService,
  ) {}

  /**
   * API che ritorna tutte le anomalie salvate
   * @param req dati utente
   * @param res
   * @returns
   */
  @Get()
  async getAllAnomaly(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Anomaly',
    };

    try {
      const anomalies = await this.anomalyService.getAllAnomalyByUserId(
        req.user.id,
      );
      if (!anomalies?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna anomalia trovata',
        );
        return res.status(204).json();
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperate ${anomalies.length} anomalie`,
      );
      return res.status(200).json(anomalies);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero anomalie',
      });
    }
  }

  /**
   * API che ritorna tutti i veicoli con il relativo andamento delle anomalie
   * @param req recupero utente dal token
   * @param res
   * @param body data di inizio e fine ricerca
   * @returns
   */
  @Post()
  async getAnomalyByDate(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() body: { dateFrom: string; dateTo: string },
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Anomaly today',
    };

    if (!body.dateFrom) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error: new Error('Inserisci una data di inizio'),
      });
      return res.status(400).json({ message: 'Inserisci una data di inizio' });
    }
    const dateFrom = new Date(body.dateFrom);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!body.dateTo) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error: new Error('Inserisci una data di fine'),
      });
      return res.status(400).json({ message: 'Inserisci una data di fine' });
    }

    const dateTo = new Date(body.dateTo);
    if (dateTo < dateFrom) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error: new Error(
          'La data di fine deve essere successiva alla data di inizio',
        ),
      });
      return res.status(400).json({
        message: 'La data di fine deve essere successiva alla data di inizio',
      });
    }

    try {
      // logica set redis giorno prima al momento dismessa

      // const yesterday = new Date(today);
      // yesterday.setDate(yesterday.getDate() - 1);
      let lastUpdate;
      let anomalies: any[] = [];
      // Case 1: Se dateFrom === dateTo e il giorno è oggi usare todayAnomaly
      if (dateFrom.getTime() === dateTo.getTime()) {
        if (dateFrom.getTime() === today.getTime()) {
          const anomaliesData = await this.anomalyService.getTodayAnomalyRedis(
            req.user.id,
            dateFrom,
          );
          lastUpdate = anomaliesData.lastUpdate;
          anomalies = anomaliesData.anomalies;
          // se redis vuoto per qualche motivo
          if (!lastUpdate) {
            anomalies = await this.anomalyService.getAnomalyByDate(
              req.user.id,
              dateFrom,
            );
          }
        } else {
          anomalies = await this.anomalyService.getAnomalyByDate(
            req.user.id,
            dateFrom,
          );
        }
      }
      // logica set redis giorno prima al momento dismessa

      // // Case 2: Se dateFrom è ieri e il dateTo è oggi usa dayBeforeAnomaly
      // else if (
      //   dateFrom.getTime() === yesterday.getTime() &&
      //   dateTo.getTime() === today.getTime()
      // ) {
      //   const redisPromises = vehicleIds.map(async (id) => {
      //     const key = `dayBeforeAnomaly:${id}`;
      //     try {
      //       const data = await this.redis.get(key);
      //       return data ? JSON.parse(data) : null;
      //     } catch (error) {
      //       console.error(`Errore recupero da redis il veicolo ${id}:`, error);
      //       return null;
      //     }
      //   });
      //   anomalies = (await Promise.all(redisPromises)).filter(Boolean);
      // }
      // Case 3: Se nessuno dei casi è true fa getAnomalyByDateRange
      else {
        anomalies = await this.anomalyService.getAnomalyByDateRange(
          req.user.id,
          dateFrom,
          dateTo,
        );
      }
      const message = anomalies.length
        ? `Recuperate ${anomalies.length} anomalie`
        : 'Nessuna anomalia trovata';

      this.loggerService.logCrudSuccess(context, 'list', message);
      return res.status(200).json({
        lastUpdate,
        vehicles: anomalies,
      });
    } catch (error) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error,
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore durante il recupero delle anomalie',
      });
    }
  }

  /**
   * API per il recupero delle anomalie associate al veicolo passato e in base al numero del count, se 0 recupero tutte le anomalie salvate,
   * se viene inserito un numero recupero la quantità indicata, partendo dalla piu recente
   * @param req user token data
   * @param res
   * @param body veid del veicolo, count per identificare il numero di anomalie da recuperare
   * @returns
   */
  @Post('veId')
  async getAllAnomalyVeId(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() body: { veId: number; count: number },
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Anomaly',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero

    if (isNaN(veId)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'list',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    const count: number = body.count || 0;

    if (isNaN(count)) {
      this.loggerService.logCrudError({
        error: new Error('Il count deve essere un numero valido'),
        context,
        operation: 'list',
      });
      return res.status(400).json({
        message: 'Il count deve essere un numero valido',
      });
    }

    try {
      const anomalies = await this.anomalyService.getAllAnomalyByVeId(
        req.user.id,
        veId,
        count,
      );
      if (!anomalies?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna anomalia trovata',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperate ${anomalies[0].anomalies.length} anomalie`,
      );
      return res.status(200).json(anomalies[0]);
    } catch (error) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error,
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore durante il recupero delle anomalie',
      });
    }
  }

  /**
   * API per recuperare l'anomalia piu recente per ogni veicolo associato, recupera
   * la più recente escludendo la data odierna. Prima cerca su Redis e se non trova
   * fa una query di ricerca
   * @param req Utente con token
   * @param res
   * @returns
   */
  @Get('last')
  async getLastAnomaly(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Anomaly last',
    };

    try {
      const anomalies = await this.anomalyService.getLastAnomalyRedis(
        req.user.id,
      );

      if (!anomalies || anomalies.length === 0) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna anomalia trovata',
        );
        return res.status(204).json();
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperate ${anomalies.length} anomalie `,
      );
      res.status(200).json({ vehicles: anomalies });
    } catch (error) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error,
      });

      res.status(500).json({
        message: error.message || 'Errore nel recupero delle anomalie',
      });
    }
  }

  /**
   * API per i controlli dei mezzi in base al range temporale
   * @param res
   * @param body
   */
  @Post('checkerrors')
  async checkErrors(@Res() res: Response, @Body() body) {
    const data = await this.controlService.checkErrors(
      body.dateFrom,
      body.dateTo,
    );
    if (data) {
      res.status(200).json(data);
    } else {
      return res.status(204).json();
    }
  }

  /**
   * Funzione API che permette il ricalcolo delle anomalie per la giornata odierna e,
   * una volta popolato il database, imposta i nuovi risultati su redis di oggi e ieri
   * @param res
   * @returns
   */
  @Get('updatetoday')
  async updateTodayAnomaly(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Anomaly',
    };
    try {
      const datefrom = new Date();
      const dateto = new Date(datefrom);
      datefrom.setHours(0, 0, 0, 0);
      dateto.setDate(dateto.getDate() + 1);
      const data = await this.controlService.checkErrors(
        datefrom.toISOString(),
        dateto.toISOString(),
      );
      if (!data || data.length === 0) {
        this.loggerService.logCrudSuccess(
          context,
          'update',
          'Nessuna dato da salvare',
        );
        return res.status(204).json();
      }

      const processAnomalies = async (data, anomalyService) => {
        const anomalyPromises = data
          .filter((item) => item?.veId)
          .map(async (item) => {
            const anomalyData = {
              veId: item.veId,
              date: item.sessions?.[0]?.date ?? null,
              gps: item.sessions?.[0]?.anomalies?.GPS ?? null,
              antenna: item.sessions?.[0]?.anomalies?.Antenna ?? null,
              detection_quality:
                item.sessions?.[0]?.anomalies?.detection_quality ?? null,
              session:
                item.anomaliaSessione ??
                item.sessions?.[0]?.anomalies?.open ??
                null,
            };
            if (
              anomalyData.session &&
              anomalyData.session.includes('nulla') &&
              item.sessions.length === 0
            ) {
              anomalyData.antenna = item.anomaliaSessione;
              anomalyData.gps = item.anomaliaSessione;
            }
            return anomalyService.createAnomaly(
              anomalyData.veId,
              anomalyData.date,
              anomalyData.gps,
              anomalyData.antenna,
              anomalyData.detection_quality,
              anomalyData.session,
            );
          });

        return Promise.all(anomalyPromises);
      };

      await processAnomalies(data, this.anomalyService);

      const todaykeys = await this.redis.keys('todayAnomaly:*');
      if (todaykeys.length > 0) {
        await this.redis.del(todaykeys);
      }

      const now = new Date();

      const todayAnomalies = await this.anomalyService.getAnomalyByDate(1, now);
      await this.anomalyService.setTodayAnomalyRedis(todayAnomalies);

      // logica set redis giorno prima al momento dismessa

      // const dayBeforekeys = await this.redis.keys('dayBeforeAnomaly:*');
      // if (dayBeforekeys.length > 0) {
      //   await this.redis.del(dayBeforekeys);
      // }
      // const dayBefore = new Date(
      //   now.getFullYear(),
      //   now.getMonth(),
      //   now.getDate() - 1,
      // );
      // const yesterdayAnomalies = await this.anomalyService.getAnomalyByDate(
      //   vehicleIds,
      //   dayBefore,
      // );
      // await this.anomalyService.setDayBeforeAnomalyRedis(yesterdayAnomalies);

      this.loggerService.logCrudSuccess(
        context,
        'update',
        `Aggiornate ${todayAnomalies.length} anomalie `,
      );
      res.status(200).json({ message: 'Anomalie odierne aggiornate' });
    } catch (error) {
      this.loggerService.logCrudError({
        context,
        operation: 'update',
        error,
      });

      res.status(500).json({
        message: error.message || 'Errore nel recupero delle anomalie',
      });
    }
  }
  /**
   * Recupera alcuni dati riguardanti il veicolo e il suo andamento, come il numero di anomalie, sessioni
   * e tipologia di errori
   * @param req user data
   * @param res stats object
   * @param veId veid identificativo del veicolo
   * @returns
   */
  @Get('stats')
  async getStatsByVeId(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Query('veId') veId: number,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Anomaly stats',
      resourceId: veId,
    };
    const veIdNumber = Number(veId); // Garantisce che veId sia un numero

    if (isNaN(veIdNumber)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'read',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    try {
      const stats = await this.anomalyService.getStatsByVeId(
        req.user.id,
        veIdNumber,
      );
      if (!stats) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Nessuna statisca calcolata in mancanza di dati',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Recuperate le statistiche`,
      );
      return res.status(200).json(stats);
    } catch (error) {
      this.loggerService.logCrudError({
        context,
        operation: 'read',
        error,
      });

      return res.status(error.status || 500).json({
        message:
          error.message ||
          'Errore durante il recupero delle statistiche anomalie',
      });
    }
  }

  /**
   * API che restituisce le anomalie in base al veid passato e al range temporale
   * @param req user data
   * @param res
   * @param body veId del veicolo, date per la ricerca
   * @returns
   */
  @Post('veId/ranged')
  async getAnomalyVeIdRanged(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() body: { veId: number; dateFrom: string; dateTo: string },
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Anomaly',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero

    if (isNaN(veId)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'list',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    if (!body.dateFrom) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error: new Error('Inserisci una data di inizio'),
      });
      return res.status(400).json({ message: 'Inserisci una data di inizio' });
    }
    const dateFrom = new Date(body.dateFrom);

    if (!body.dateTo) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error: new Error('Inserisci una data di fine'),
      });
      return res.status(400).json({ message: 'Inserisci una data di fine' });
    }

    const dateTo = new Date(body.dateTo);
    if (dateTo < dateFrom) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error: new Error(
          'La data di fine deve essere successiva alla data di inizio',
        ),
      });
      return res.status(400).json({
        message: 'La data di fine deve essere successiva alla data di inizio',
      });
    }
    try {
      const anomalies = await this.anomalyService.getAnomalyVeIdByDateRange(
        req.user.id,
        veId,
        dateFrom,
        dateTo,
      );
      if (!anomalies?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna anomalia trovata',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperate ${anomalies[0].anomalies.length} anomalie`,
      );
      return res.status(200).json(anomalies[0]);
    } catch (error) {
      this.loggerService.logCrudError({
        context,
        operation: 'list',
        error,
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore durante il recupero delle anomalie',
      });
    }
  }
}
