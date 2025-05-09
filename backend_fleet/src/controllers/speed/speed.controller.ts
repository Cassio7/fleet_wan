import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Role } from 'src/classes/enum/role.enum';
import { UserFromToken } from 'src/classes/interfaces/userToken.interface';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { SpeedService } from 'src/services/speed/speed.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('speed')
@Roles(Role.Admin)
export class SpeedController {
  constructor(
    private readonly speedService: SpeedService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Chiamata per recuperare le migliori velocità divise per tempo
   * @param req user data
   * @param res
   * @returns
   */
  @Get()
  async getSpeeds(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Speed',
    };
    try {
      const speeds = await this.speedService.getSpeeds();
      if (!speeds) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna velocità trovata',
        );
        return res.status(404).json({ message: 'Nessuna velocità trovata' });
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Velocità recuperare con successo`,
      );
      return res.status(200).json(speeds);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel recupero delle velocità ',
      });
    }
  }
  /**
   * Chiamata per aggiornare le velocità calcolate
   * @param req user data
   * @param res
   * @returns
   */
  @Post()
  async updateSpeeds(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Speed',
    };
    try {
      const speeds = await this.speedService.setSpeeds();
      if (!speeds) {
        this.loggerService.logCrudSuccess(
          context,
          'update',
          'Nessuna velocità trovata',
        );
        return res.status(404).json({ message: 'Nessuna velocità trovata' });
      }
      this.loggerService.logCrudSuccess(
        context,
        'update',
        `Velocità aggiornate e recuperate con successo`,
      );
      return res.status(200).json(speeds);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'update',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel update delle velocità',
      });
    }
  }
}
