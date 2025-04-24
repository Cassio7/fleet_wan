import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { RefresherService } from 'src/services/refresher/refresher.service';
import { sameDate, validateDateRange } from 'src/utils/utils';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('refresher')
export class RefresherController {
  constructor(
    private readonly refresherService: RefresherService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per recuperare giornate in base al range e ricalcola le anomalie del mezzo passato
   * @param req user data
   * @param body identificativo veicolo e date
   * @param res
   * @returns
   */
  @Post()
  async refreshVehicleAnomaly(
    @Req() req: Request & { user: UserFromToken },
    @Body() body: { veId: number; dateFrom: string; dateTo: string },
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Refresh',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero

    if (isNaN(veId)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'update',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      this.loggerService.logCrudError({
        error: new Error(validation.message),
        context,
        operation: 'update',
      });
      return res.status(400).json({ message: validation.message });
    }
    const dateFrom_new = new Date(dateFrom + 'Z');
    const dateTo_new = new Date(dateTo + 'Z');

    const today = new Date();
    today.setHours(0, 0, 0, 0); // resetta a mezzanotte

    const isToday = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    };

    if (isToday(dateFrom_new) || isToday(dateTo_new)) {
      this.loggerService.logCrudError({
        error: new Error('Inserire una data diversa da quella ordierna'),
        context,
        operation: 'update',
      });
      return res
        .status(400)
        .json({ message: 'Inserire una data diversa da quella ordierna' });
    }

    const equal = sameDate(dateFrom_new, dateTo_new);
    if (equal) {
      dateTo_new.setHours(23, 59, 59, 0);
    }
    try {
      await this.refresherService.refreshVehicleAnomaly(
        [veId],
        dateFrom_new,
        dateTo_new,
      );
      this.loggerService.logCrudSuccess(
        context,
        'update',
        `Refresh dati avvenuta con successo, VeId = ${veId}, dateFrom = ${dateFrom_new.toISOString()}, dateFrom = ${dateTo_new.toISOString()}`,
      );
      return res.status(200).json({ message: 'Dati aggiornati con successo' });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'update',
      });

      return res.status(error.status || 500).json({
        message:
          error.message || 'Errore nel refresh dei dati con range temporale',
      });
    }
  }
}
