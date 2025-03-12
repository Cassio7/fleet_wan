import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { RealtimeService } from 'src/services/realtime/realtime.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
@Controller('realtimes')
export class RealtimeController {
  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per recuperare l'ultima posizione per ogni veicolo assegnato
   * @param req
   * @param res
   * @returns
   */
  @Get('last')
  async getLastHistory(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Realtime last',
    };
    try {
      const data = await this.realtimeService.getLastRealtimeHistory(
        req.user.id,
      );
      if (!data?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna posizione trovata',
        );
        return res.status(204).json({ message: 'Nessuna posizione trovata' });
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Lista ultima posizione recuperata per ${data.length} veicoli`,
      );
      res.status(200).json(data);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel recupero dei last realtimes',
      });
    }
  }
}
