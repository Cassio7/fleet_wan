import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LoggerService } from 'src/log/service/logger.service';
import { WorksiteService } from 'src/services/worksite/worksite.service';
import { Response } from 'express';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { LogContext } from 'src/log/logger.types';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('worksites')
export class WorksiteController {
  constructor(
    private readonly worksiteService: WorksiteService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  async getWorksites(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Worksite All admin',
    };
    try {
      const worksites = await this.worksiteService.getWorksiteAdmin();
      if (!worksites?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun cantiere trovato',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati ${worksites.length} cantieri`,
      );
      return res.status(200).json(worksites);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero cantieri',
      });
    }
  }
}
