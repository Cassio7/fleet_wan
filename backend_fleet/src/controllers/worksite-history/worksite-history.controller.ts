import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { WorksiteHistoryService } from './../../services/worksite-history/worksite-history.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('worksitehistory')
export class WorksiteHistoryController {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly worksiteHistoryService: WorksiteHistoryService,
  ) {}

  @Roles(Role.Admin)
  @Post()
  async createtWorksiteHistory(
    @Req() req: Request & { user: UserFromToken },
    @Body()
    body: {
      veId: number;
      worksiteId: number;
      dateFrom: string;
      comment: string;
    },
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite History',
      resourceId: body.veId,
    };
    const veId = Number(body.veId); // Garantisce che veId sia un numero
    if (isNaN(veId)) {
      this.loggerService.logCrudError({
        error: new Error('Il veId deve essere un numero valido'),
        context,
        operation: 'create',
      });
      return res.status(400).json({
        message: 'Il veId deve essere un numero valido',
      });
    }
    const worksiteId = Number(body.worksiteId); // Garantisce che veId sia un numero
    if (isNaN(worksiteId)) {
      this.loggerService.logCrudError({
        error: new Error('Il worksiteId deve essere un numero valido'),
        context,
        operation: 'create',
      });
      return res.status(400).json({
        message: 'Il worksiteId deve essere un numero valido',
      });
    }
    try {
      const worksiteHistory =
        await this.worksiteHistoryService.createWorksiteHistory(
          veId,
          worksiteId,
          body.dateFrom,
          body.comment,
        );
      this.loggerService.logCrudSuccess(
        context,
        'create',
        `Veicolo con veId: ${worksiteHistory.vehicle.veId} spostato con successo al cantiere ${worksiteHistory.worksite?.name ?? 'LIBERO'}`,
      );

      return res.status(201).json({
        worksiteHistory: {
          worksite: {
            id: worksiteHistory.worksite.id,
            name: worksiteHistory.worksite.name,
          },
          dateFrom: worksiteHistory.dateFrom,
          comment: worksiteHistory.comment,
        },
        message: `Veicolo con veId: ${worksiteHistory.vehicle.veId} spostato con successo al cantiere ${worksiteHistory.worksite?.name ?? 'LIBERO'}`,
      });
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'create',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore creazione storico cantieri',
      });
    }
  }

  /**
   * API per il recupero dello storico di un veicolo, soltanto se ho accesso al veicolo stesso
   * @param req user data
   * @param res
   * @param veId idenfiticatico veicolo
   * @returns
   */
  @Roles(Role.Admin, Role.Responsabile, Role.Capo)
  @Get(':id')
  async getWorksiteHistoryByVeId(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id', ParseIntPipe) veId: number,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite History',
      resourceId: veId,
    };
    try {
      const worksiteHistories =
        await this.worksiteHistoryService.getWorksiteHistoryByVeId(
          req.user.id,
          Number(veId),
          false,
        );
      if (!worksiteHistories?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuno storico cantiere per il mezzo',
        );
        return res.status(204).json({
          message: 'Nessuno storico cantiere per il mezzo',
        });
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati lo storico cantieri del mezzo con veId: ${veId} con ${worksiteHistories.length} spostamenti`,
      );
      return res.status(200).json(worksiteHistories);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero storico cantieri',
      });
    }
  }

  /**
   * API per il recupero dello storico di un veicolo, solo admin
   * @param req user data
   * @param res
   * @param veId idenfiticatico veicolo
   * @returns
   */
  @Roles(Role.Admin)
  @Get('admin/:id')
  async getWorksiteHistoryByVeIdAdmin(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id', ParseIntPipe) veId: number,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite History Admin',
      resourceId: veId,
    };
    try {
      const worksiteHistories =
        await this.worksiteHistoryService.getWorksiteHistoryByVeId(
          req.user.id,
          Number(veId),
          true,
        );
      if (!worksiteHistories?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuno storico cantiere per il mezzo',
        );
        return res.status(204).json({
          message: 'Nessuno storico cantiere per il mezzo',
        });
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati lo storico cantieri del mezzo con veId: ${veId} con ${worksiteHistories.length} spostamenti`,
      );
      return res.status(200).json(worksiteHistories);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero storico cantieri',
      });
    }
  }
}
