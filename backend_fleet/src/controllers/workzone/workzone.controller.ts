import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { WorkzoneEntity } from 'src/classes/entities/workzone.entity';
import { Role } from 'src/classes/enum/role.enum';
import { UserFromToken } from 'src/classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { WorkzoneService } from 'src/services/workzone/workzone.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('workzone')
export class WorkzoneController {
  constructor(
    private readonly workzoneService: WorkzoneService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per il recupero delle zone di lavoro da parte di admin
   * @param req
   * @param res
   * @returns
   */
  @Get()
  async getAllWorkzones(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Workzone (admin)',
    };
    try {
      const workzones: WorkzoneEntity[] =
        await this.workzoneService.getAllWorkzone();

      if (!workzones?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessuna zona di lavoro trovata',
        );
        return res.status(204).json();
      }

      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Trovate ${workzones.length} zone di lavoro`,
      );

      res.status(200).json(workzones);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore nel recupero delle zone di lavoro',
      });
    }
  }
}
