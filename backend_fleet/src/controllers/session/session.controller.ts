import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { SessionService } from 'src/services/session/session.service';
import { validateDateRange } from 'src/utils/utils';

@UseGuards(AuthGuard, RolesGuard)
@Controller('sessions')
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly loggerService: LoggerService,
  ) {}
  /**
   * API per prendere tutte le sessioni in base all'id
   * @param res
   * @param body veId del veicolo
   * @param req user data
   * @returns
   */
  @Post('veId')
  async getAllSessionByVeId(
    @Res() res: Response,
    @Body() body: { veId: number },
    @Req() req: Request & { user: UserFromToken },
  ) {
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
   * @param req user data
   * @returns
   */
  @Post('veId/ranged')
  async getAllSessionByVeIdRanged(
    @Res() res: Response,
    @Body() body: { veId: number; dateFrom: string; dateTo: string },
    @Req() req: Request & { user: UserFromToken },
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Session ranged',
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
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);
    try {
      const data = await this.sessionService.getAllSessionsByVeIdAndRange(
        req.user.id,
        veId,
        dateFrom_new,
        dateTo_new,
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
   * @param body VeId veicolo
   * @returns
   */
  @Post('veId/lastvalid')
  async getLastSession(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() body: { veId: number },
  ) {
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

  /**
   * API che restituisce tutte le sessioni attive se la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param req user data
   * @param res
   * @returns
   */
  @Get('active')
  async getAllActiveSession(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
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
  @Post('veId/active')
  async getActiveSessionByVeId(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() body: { veId: number },
  ) {
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
