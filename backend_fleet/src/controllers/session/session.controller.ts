import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Role } from 'src/classes/enum/role.enum';
import { UserFromToken } from 'src/classes/interfaces/userToken.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { SessionService } from 'src/services/session/session.service';
import { sameDate, validateDateRange } from 'src/utils/utils';

@UseGuards(AuthGuard, RolesGuard)
@Controller('sessions')
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  async getAllSessions(
    @Res() res: Response,
    @Req() req: Request & { user: UserFromToken },
    @Query('veId') veId: number,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    if (veId && dateFrom && dateTo) {
      return this.getAllSessionByVeIdRanged(
        res,
        { veId, dateFrom, dateTo },
        'false',
        req,
      );
    } else if (veId && !dateFrom && !dateTo) {
      return this.getAllSessionByVeId(res, { veId }, req);
    }

    return res.status(400).send({
      message: 'Parametri mancanti',
    });
  }

  /**
   * API per prendere tutte le sessioni in base all'id
   * @param res
   * @param body veId del veicolo
   * @param req user data
   * @returns
   */
  private async getAllSessionByVeId(
    res: Response,
    body: { veId: number },
    req: Request & { user: UserFromToken },
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Session',
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
    try {
      const data = await this.sessionService.getAllSessionByVeId(
        req.user.id,
        veId,
      );

      if (!data?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna sessione trovata',
        );
        return res.status(404).json({ message: 'Nessuna sessione trovata' });
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Lista sessioni (${data.length}) recuperata con successo VeId = ${veId}`,
      );
      return res.status(200).json(data);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message:
          error.message || 'Errore nel recupero delle sessioni del veicolo ',
      });
    }
  }

  /**
   * API per prendere tutte le sessioni indicando range temporale in base all'id
   * @param res
   * @param body veId del veicolo, Data inizio e data fine ricerca
   * @param filter permette di filtrare i tag recuperati al 20%
   * @param req user data
   * @returns
   */
  private async getAllSessionByVeIdRanged(
    res: Response,
    body: { veId: number; dateFrom: string; dateTo: string },
    filter: string,
    req: Request & { user: UserFromToken },
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Session ranged',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero
    const isFilter = filter === 'true'; // prendo il boolean del filter

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
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;

    // controllo data valida
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      this.loggerService.logCrudError({
        error: new Error(validation.message),
        context,
        operation: 'list',
      });
      return res.status(400).json({ message: validation.message });
    }
    const dateFrom_new = new Date(dateFrom + 'Z');
    const dateTo_new = new Date(dateTo + 'Z');
    const equal = sameDate(dateFrom_new, dateTo_new);
    if (equal) {
      dateTo_new.setHours(23, 59, 59, 0);
    }
    try {
      const data = await this.sessionService.getAllSessionsByVeIdAndRange(
        req.user.id,
        veId,
        dateFrom_new,
        dateTo_new,
        isFilter,
      );

      if (!data?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna sessione trovata',
        );
        return res.status(204).json({ message: 'Nessuna sessione trovata' });
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Lista sessioni (${data.length}) recuperata con successo, VeId = ${veId}, dateFrom = ${dateFrom_new.toISOString()}, dateFrom = ${dateTo_new.toISOString()}`,
      );
      return res.status(200).json(data);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message:
          error.message ||
          'Errore nel recupero delle sessioni con range temporale',
      });
    }
  }

  /**
   * API per prendere l'ultima sessione in base all veid passato
   * @param req user data
   * @param res
   * @returns
   */
  @Get('last')
  async getLastSessionByVeId(
    @Res() res: Response,
    @Query('veId', ParseIntPipe) veId: number,
    @Req() req: Request & { user: UserFromToken },
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Session',
      resourceId: veId,
    };

    if (isNaN(veId)) {
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
      // prima controlla se esiste su redis, se ci sta recupera direttamente usando la key
      const exist = await this.sessionService.getLastValidSessionRedis([veId]);
      let last = null;
      if (exist) {
        last = await this.sessionService.getSessionByKey(
          req.user.id,
          exist.get(veId),
        );
      }
      // se non trova nulla allora fa la ricerca normale
      else {
        last = await this.sessionService.getLastSession(req.user.id, veId);
      }
      if (!last) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Ultima sessione non trovata',
        );
        return res.status(204).json({ message: 'Ultima sessione non trovata' });
      }
      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Ultima sessione recuperata con successo, Id = ${last.id} , VeId = ${veId}, Sequence_id = ${last.sequence_id}`,
      );
      return res.status(200).json(last);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel recupero ultima sessione',
      });
    }
  }

  @Get('active')
  async getActiveSessions(
    @Req() req: Request & { user: UserFromToken },
    @Query('veId') veIdParam: string,
    @Res() res: Response,
  ) {
    const veId = veIdParam ? parseInt(veIdParam, 10) : undefined;

    if (veIdParam || veId) {
      return this.getActiveSessionByVeId(req, res, { veId });
    }

    return this.getAllActiveSession(req, res);
  }

  /**
   * API che restituisce tutte le sessioni attive se la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param req user data
   * @param res
   * @returns
   */
  private async getAllActiveSession(
    req: Request & { user: UserFromToken },
    res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Session active all',
    };
    try {
      const actives = await this.sessionService.getAllActiveSession(
        req.user.id,
      );
      if (!actives) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna sessione trovata',
        );
        return res.status(204).json({ message: 'Nessuna sessione trovata' });
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Lista veicoli con sessioni attive trovata num = ${actives.length}`,
      );
      return res.status(200).json(actives);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nella ricerca delle sessioni attive',
      });
    }
  }

  /**
   * API che restituisce la sessione attiva se, la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param req user data
   * @param res
   * @param body veId del veicolo
   * @returns
   */
  private async getActiveSessionByVeId(
    req: Request & { user: UserFromToken },
    res: Response,
    body: { veId: number },
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Session active',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero

    if (isNaN(veId)) {
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
      const active = await this.sessionService.getActiveSessionByVeId(
        req.user.id,
        veId,
      );
      if (!active) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Nessuna sessione attiva',
        );
        return res.status(200).json({ active: false });
      }
      // prima controlla se esiste su redis, se ci sta recupera direttamente usando la key
      const exist = await this.sessionService.getLastValidSessionRedis([veId]);
      let last = null;
      if (exist) {
        last = await this.sessionService.getSessionByKey(
          req.user.id,
          exist.get(veId),
        );
      }
      // se non trova nulla allora fa la ricerca normale
      else {
        last = await this.sessionService.getLastSession(req.user.id, veId);
      }
      if (!last) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Ultima sessione non trovata',
        );
        return res.status(200).json({ active: false });
      }
      const firstDate = new Date(active.period_to);
      const secondDate = new Date(last.period_to);
      if (firstDate <= secondDate) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'La sessione a 0 non è attiva',
        );
        return res.status(200).json({ active: false });
      }
      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Sessione attiva recuperata con successo, Id = ${active.id} , VeId = ${veId}, Sequence_id = ${active.sequence_id}`,
      );
      return res.status(200).json({
        active: true,
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel recupero della sessione attiva',
      });
    }
  }
}
