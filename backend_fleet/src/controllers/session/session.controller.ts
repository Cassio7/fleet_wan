import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { AssociationService } from 'src/services/association/association.service';
import { SessionService } from 'src/services/session/session.service';
import { VehicleService } from 'src/services/vehicle/vehicle.service';
import { validateDateRange } from 'src/utils/utils';

@UseGuards(AuthGuard, RolesGuard)
@Controller('session')
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly associationService: AssociationService,
    private readonly vehicleService: VehicleService,
  ) {}

  /**
   * API che restituisce tutte le sessioni attive se la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param res
   */
  @Get('active')
  async getAllActiveSession(@Res() res: Response) {
    try {
      const actives = await this.sessionService.getAllActiveSession();
      if (actives) {
        const realActive = [];
        for (const active of actives) {
          const last = await this.sessionService.getLastSession(
            active.vehicle_veId,
          );
          if (last) {
            const firstDate = new Date(active.session_period_to);
            const secondDate = new Date(last.period_to);
            if (firstDate >= secondDate) {
              realActive.push(active);
            }
          }
        }
        res.status(200).json({
          sessions: realActive,
        });
      } else {
        res.status(200).json({ message: 'No sessioni attive' });
      }
    } catch (error) {
      console.error('Errore nella ricerca delle sessioni attive: ' + error);
      res.status(500).json({
        message: 'Errore nella ricerca delle sessioni attive.',
      });
    }
  }

  /**
   * API per prendere tutte le sessioni in base all'id
   * @param res
   * @param params
   */
  @Get(':id')
  async getAllSessionByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const data = await this.sessionService.getAllSessionByVeId(params.id);
      if (data.length > 0) {
        res.status(200).json(data);
      } else
        res.status(404).json({ message: `No Session per id: ${params.id}` });
    } catch (error) {
      console.error(
        'Errore nella ricerca della sessione del veicolo: ' + error,
      );
      res.status(500).json({
        message: 'Errore nella ricerca della sessione del veicolo.',
      });
    }
  }

  /**
   * API per prendere tutte le sessioni indicando range temporale in base all'id
   * @param res
   * @param params VeId
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  @Post(':veId')
  async getAllSessionByVeIdRanged(
    @Res() res: Response,
    @Param() params: any,
    @Body() body: any,
    @Req() req: Request & { user: UserFromToken },
  ) {
    const vehicles = (await this.associationService.getVehiclesByUserRole(
      req.user.id,
    )) as VehicleEntity[];
    if (!vehicles || !Array.isArray(vehicles)) {
      return res.status(404).json({ message: 'Nessun Veicolo associato' });
    }
    const vehicle = vehicles.find(
      (element) => element.veId === Number(params.veId),
    );

    if (!vehicle) {
      return res.status(404).json({
        message: `Non hai i permessi per visualizzare il veicolo con VeId: ${params.veId}`,
      });
    }
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;

    // controllo data valida
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return res.status(400).json(validation.message);
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);
    try {
      const data = await this.sessionService.getAllSessionByVeIdRanged(
        params.veId,
        dateFrom_new,
        dateTo_new,
      );
      if (data.length > 0) {
        res.status(200).json(data);
      } else
        res.status(404).json({ message: `No Session per id: ${params.veId}` });
    } catch (error) {
      console.error(
        'Errore nel recupero delle sessioni con range temporale: ' + error,
      );
      res.status(500).json({
        message: 'Errore nel recupero delle sessioni con range temporale',
      });
    }
  }

  /**
   * Restituisce l'ultima sessione di ogni veicolo in un range di tempo
   * @param res
   * @param body dateFrom e dateTo del range
   */
  @Post('lastranged/all')
  async getAllVehiclesLastSessionByVeIdRanged(
    @Res() res: Response,
    @Body() body: any,
  ) {
    try {
      const dateFrom = body.dateFrom;
      const dateTo = body.dateTo;
      const sessions =
        await this.sessionService.getAllVehiclesLastSessionByVeIdRanged(
          dateFrom,
          dateTo,
        );
      if (sessions) res.status(200).json(sessions);
      else res.status(404).json({ message: 'No last session found' });
    } catch (error) {
      console.error(
        'Errore nella ricerca della sessione del veicolo: ' + error,
      );
      res.status(500).json({
        message: 'Errore nella ricerca della sessione del veicolo.',
      });
    }
  }
  /**
   * Ritorna un array con l'ultima sessione di tutti i veicoli
   * @param res
   */
  @Get('last/all')
  async getAllVehiclesLastSession(@Res() res: Response) {
    try {
      const vehicles = await this.vehicleService.getAllVehicles(); // Prendere tutti i veicoli
      const lastSessions = await Promise.all(
        vehicles.map(async (vehicle) => {
          return this.sessionService.getLastSession(vehicle.veId); // Per ogni veicolo, cercare l'ultima sessione
        }),
      );
      if (lastSessions.length > 0)
        res.status(200).json(lastSessions); // Restituire l'array di sessioni come JSON
      else res.status(404).json({ message: 'Nessuna sessione trovata' });
    } catch (error) {
      console.error(
        "Errore nella ricerca dell'ultima sessione del veicolo: " + error,
      );
      res.status(500).json({
        message: "Errore nella ricerca dell'ultima sessione del veicolo.",
      });
    }
  }

  /**
   * API per prendere l'ultima sessione in base all'id
   * @param res
   * @param params VeId identificativo Veicolo
   */
  @Get('last/:id')
  async getLastSession(@Res() res: Response, @Param() params: any) {
    try {
      const data = await this.sessionService.getLastSession(params.id);
      if (data) res.status(200).json(data);
      else res.status(404).json({ message: `No Session per id: ${params.id}` });
    } catch (error) {
      console.error("Errore nel recupero dell'ultima sessione: " + error);
      res.status(500).json({
        message: "Errore nel recupero dell'ultima sessione",
      });
    }
  }

  /**
   * API che restituisce la sessione attiva se, la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param res
   * @param params VeId identificativo Veicolo
   */
  @Get('active/:id')
  async getActiveSessionByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const active = await this.sessionService.getActiveSessionByVeId(
        params.id,
      );
      const last = await this.sessionService.getLastSession(params.id);
      if (!active || !last) {
        res.status(404).json({
          message: `Nessuna sessione attiva registrata per id: ${params.id}`,
        });
      } else {
        const firstDate = new Date(active.period_to);
        const secondDate = new Date(last.period_to);
        if (firstDate > secondDate) {
          res.status(200).json({
            session: active,
          });
        } else {
          res.status(200).json({ message: 'Non attivo' });
        }
      }
    } catch (error) {
      console.error('Errore nel recupero della sessione attiva: ' + error);
      res.status(500).json({
        message: 'Errore nel recupero della sessione attiva',
      });
    }
  }

  /**
   * API per prendere tutte le distanze delle sessioni in base all'id
   * @param res
   * @param params
   */
  @Get('distance/:id')
  async getDistanceSession(@Res() res: Response, @Param() params: any) {
    try {
      const data = await this.sessionService.getDistanceSession(params.id);
      if (data) res.status(200).json(data);
      else res.status(404).json({ message: `No Session per id: ${params.id}` });
    } catch (error) {
      console.error('Errore nel recupero della distanza: ' + error);
      res.status(500).json({
        message: 'Errore nel recupero della distanza.',
      });
    }
  }

  /**
   * API per prendere tutte le sessioni indicando range temporale
   * @param params VeId
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  @Post('ranged/all')
  async getAllSessionRanged(@Res() res: Response, @Body() body: any) {
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;

    // controllo data valida
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return res.status(400).json(validation.message);
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);
    try {
      const data = await this.sessionService.getSessionInTimeRange(
        dateFrom_new,
        dateTo_new,
      );
      if (data.length > 0) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ message: `No Session per id:` });
      }
    } catch (error) {
      console.error(
        'Errore nel recupero delle sessioni con range temporale: ' + error,
      );
      res.status(500).json({
        message: 'Errore nel recupero delle sessioni con range temporale',
      });
    }
  }
}
