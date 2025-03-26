import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { EquipmentService } from 'src/services/equipment/equipment.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('equipments')
export class EquipmentController {
  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly loggerService: LoggerService,
  ) {}

  @Get()
  async getEquipment(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Equipment All admin',
    };
    try {
      const equipment = await this.equipmentService.getEquipments();
      if (!equipment?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun attrezzatura trovata',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati ${equipment.length} attrezzature`,
      );
      return res.status(200).json(equipment);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero attrezzature',
      });
    }
  }
}
