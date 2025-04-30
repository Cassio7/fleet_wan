import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from 'src/classes/enum/role.enum';
import { UserFromToken } from 'src/classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { RentalService } from 'src/services/rental/rental.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('rentals')
export class RentalController {
  constructor(
    private readonly rentalService: RentalService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  async getRentals(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ): Promise<Response> {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Rentals All admin',
    };
    try {
      const rentals = await this.rentalService.getRentals();
      if (!rentals?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun noleggio trovato',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati ${rentals.length} noleggi`,
      );
      return res.status(200).json(rentals);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero noleggi',
      });
    }
  }
}
