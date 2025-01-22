import {
  Body,
  Controller,
  Get,
  Param,
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
@Controller('session')
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API che restituisce tutte le sessioni attive se la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param res
   */
  //@Get('active')
  // async getAllActiveSession(@Res() res: Response) {
  //   try {
  //     const actives = await this.sessionService.getAllActiveSession();
  //     if (actives) {
  //       const realActive = [];
  //       for (const active of actives) {
  //         const last = await this.sessionService.getLastSession(
  //           active.vehicle_veId,
  //         );
  //         if (last) {
  //           const firstDate = new Date(active.session_period_to);
  //           const secondDate = new Date(last.period_to);
  //           if (firstDate >= secondDate) {
  //             realActive.push(active);
  //           }
  //         }
  //       }
  //       res.status(200).json({
  //         sessions: realActive,
  //       });
  //     } else {
  //       res.status(200).json({ message: 'No sessioni attive' });
  //     }
  //   } catch (error) {
  //     console.error('Errore nella ricerca delle sessioni attive: ' + error);
  //     res.status(500).json({
  //       message: 'Errore nella ricerca delle sessioni attive.',
  //     });
  //   }
  // }

  /**
   * API per prendere tutte le sessioni in base all'id
   * @param res
   * @param params
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
        `Lista sessioni (${data.length}) recuperata con successo, VeId = ${veId}`,
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
   * @param req
   * @returns
   */
  @Post()
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
  @Post('lastvalid')
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
      const data = await this.sessionService.getLastSession(
        req.user.id,
        body.veId,
      );
      if (!data) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Ultima sessione non trovata',
        );
        return res.status(204).json({ message: 'Ultima sessione non trovata' });
      }
      0;
      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Ultima sessione recuperata con successo, VeId = ${veId}, Sequence_id = ${data.sequence_id}`,
      );
      return res.status(200).json(data);
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
   * Ritorna un array con l'ultima sessione di tutti i veicoli
   * @param res
   */
  //@Get('last/all')
  // async getAllVehiclesLastSession(@Res() res: Response) {
  //   try {
  //     const vehicles = await this.vehicleService.getAllVehicles(); // Prendere tutti i veicoli
  //     const lastSessions = await Promise.all(
  //       vehicles.map(async (vehicle) => {
  //         return this.sessionService.getLastSession(vehicle.veId); // Per ogni veicolo, cercare l'ultima sessione
  //       }),
  //     );
  //     if (lastSessions.length > 0)
  //       res.status(200).json(lastSessions); // Restituire l'array di sessioni come JSON
  //     else res.status(404).json({ message: 'Nessuna sessione trovata' });
  //   } catch (error) {
  //     console.error(
  //       "Errore nella ricerca dell'ultima sessione del veicolo: " + error,
  //     );
  //     res.status(500).json({
  //       message: "Errore nella ricerca dell'ultima sessione del veicolo.",
  //     });
  //   }
  // }

  /**
   * API che restituisce la sessione attiva se, la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param res
   * @param params VeId identificativo Veicolo
   */
  //@Get('active/:id')
  // async getActiveSessionByVeId(@Res() res: Response, @Param() params: any) {
  //   try {
  //     const active = await this.sessionService.getActiveSessionByVeId(
  //       params.id,
  //     );
  //     const last = await this.sessionService.getLastSession(params.id);
  //     if (!active || !last) {
  //       res.status(404).json({
  //         message: `Nessuna sessione attiva registrata per id: ${params.id}`,
  //       });
  //     } else {
  //       const firstDate = new Date(active.period_to);
  //       const secondDate = new Date(last.period_to);
  //       if (firstDate > secondDate) {
  //         res.status(200).json({
  //           session: active,
  //         });
  //       } else {
  //         res.status(200).json({ message: 'Non attivo' });
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Errore nel recupero della sessione attiva: ' + error);
  //     res.status(500).json({
  //       message: 'Errore nel recupero della sessione attiva',
  //     });
  //   }
  // }

  /**
   * API per prendere tutte le distanze delle sessioni in base all'id
   * @param res
   * @param params
   */
  @Get('distance/:id')
  async getDistanceSession(@Res() res: Response, @Param() params: any) {
    try {
      const data = await this.sessionService.getDistanceSession(params.id);
      if (data) res.status(200).json(data);
      else res.status(404).json({ message: `No Session per id: ${params.id}` });
    } catch (error) {
      console.error('Errore nel recupero della distanza: ' + error);
      res.status(500).json({
        message: 'Errore nel recupero della distanza.',
      });
    }
  }

  /**
   * API per prendere tutte le sessioni indicando range temporale
   * @param params VeId
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  @Post('ranged/all')
  async getAllSessionRanged(@Res() res: Response, @Body() body: any) {
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
      const data = await this.sessionService.getSessionInTimeRange(
        dateFrom_new,
        dateTo_new,
      );
      if (data.length > 0) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ message: `No Session per id:` });
      }
    } catch (error) {
      console.error(
        'Errore nel recupero delle sessioni con range temporale: ' + error,
      );
      res.status(500).json({
        message: 'Errore nel recupero delle sessioni con range temporale',
      });
    }
  }
}
