import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { VehicleDTO } from 'classes/dtos/vehicle.dto';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { LogContext } from 'src/log/logger.types';
import { LoggerService } from 'src/log/service/logger.service';
import { VehicleService } from 'src/services/vehicle/vehicle.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('vehicles')
export class VehicleController {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * API per modificare i dati di un veicolo dato il suo veId
   * @param req user data
   * @param res
   * @param vehicleVeId identificativo del veicolo
   * @param vehicleDTO dati in input veicolo DTO
   * @returns
   */
  @Roles(Role.Admin)
  @Put(':id')
  async updateVehicle(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('id', ParseIntPipe) vehicleVeId: number,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: VehicleDTO & {
      serviceId?: number | null;
      equipmentId?: number | null;
      rentalId?: number | null;
    },
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Vehicle',
      resourceId: vehicleVeId,
    };
    const { serviceId, equipmentId, rentalId, ...vehicleDTO } = body;
    try {
      const vehicle = await this.vehicleService.updateVehicle(
        vehicleVeId,
        vehicleDTO,
        serviceId,
        equipmentId,
        rentalId,
      );
      if (!vehicle) {
        this.loggerService.logCrudSuccess(
          context,
          'update',
          'Veicolo non trovato',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'update',
        `Aggiornato veicolo con veId : ${vehicle.veId}`,
      );
      return res.status(200).json(vehicle);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'update',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore aggiornamento del veicolo',
      });
    }
  }

  /**
   * Ritorna tutti i veicoli associati in base all utente token utente che fa la richiesta
   * @param req User token
   * @param res
   * @returns
   */
  @Roles(Role.Admin, Role.Responsabile, Role.Capo)
  @Get()
  async getAllVehicles(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Vehicle All',
    };
    try {
      const vehicles = await this.vehicleService.getAllVehicleByUser(
        req.user.id,
      );
      if (!vehicles?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun veicolo trovato',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati ${vehicles.length} Veicoli`,
      );
      return res.status(200).json(vehicles);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero veicolo',
      });
    }
  }

  /**
   * API per il recupero di tutti i veicoli presenti nel db
   * @param req user data
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Get('admin')
  async getAllVehiclesAdmin(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Vehicle All Admin',
    };
    try {
      const vehicles = await this.vehicleService.getAllVehiclesAdmin();
      if (!vehicles?.length) {
        this.loggerService.logCrudSuccess(
          context,
          'list',
          'Nessun veicolo trovato',
        );
        return res.status(204).json();
      }
      this.loggerService.logCrudSuccess(
        context,
        'list',
        `Recuperati ${vehicles.length} Veicoli`,
      );
      return res.status(200).json(vehicles);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'list',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero veicolo',
      });
    }
  }

  /**
   *  API per ritornare un veicolo in base al veId identificativo del veicolo
   * @param req Utente token per controllo permessi
   * @param res
   * @param params VeId identificativo veicoli
   * @returns
   */
  @Roles(Role.Admin, Role.Responsabile, Role.Capo)
  @Get(':veId')
  @UsePipes(ParseIntPipe)
  async getVehicleByVeId(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Param('veId') veId: number,
  ) {
    const context: LogContext = {
      userId: req.user.id,
      username: req.user.username,
      resource: 'Vehicle veId',
      resourceId: veId,
    };
    try {
      const vehicle = await this.vehicleService.getVehicleByVeId(
        req.user.id,
        veId,
      );
      if (!vehicle) {
        this.loggerService.logCrudSuccess(
          context,
          'read',
          'Nessun veicolo trovato',
        );
        return res.status(404).json({
          message: 'Nessun veicolo trovato',
        });
      }

      this.loggerService.logCrudSuccess(
        context,
        'read',
        `Recuperato Veicolo veId: ${vehicle.veId} - targa: ${vehicle.plate}`,
      );
      return res.status(200).json(vehicle);
    } catch (error) {
      this.loggerService.logCrudError({
        error,
        context,
        operation: 'read',
      });

      return res.status(error.status || 500).json({
        message: error.message || 'Errore recupero veicolo',
      });
    }
  }
}
