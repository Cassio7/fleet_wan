import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { ServiceService } from 'src/services/service/service.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('services')
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  async getServices(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Services All admin',
    };
    try {
      const services = await this.serviceService.getServices();
      if (!services?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun servizio trovato',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati ${services.length} servizi`,
      );
      return res.status(200).json(services);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero servizi',
      });
    }
  }
}
