import { InjectRedis } from '@nestjs-modules/ioredis';
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
import axios from 'axios';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Response } from 'express';
import Redis from 'ioredis';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { AssociationService } from 'src/services/association/association.service';
import { RealtimeService } from 'src/services/realtime/realtime.service';
import { VehicleService } from 'src/services/vehicle/vehicle.service';

@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
@Controller('realtimes')
export class RealtimeController {
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org/reverse';
  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly associationService: AssociationService,
    private readonly vehicleService: VehicleService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Recupera tutti i realtimes di tutti i veicoli salvati
   * @param req
   * @param res
   */
  @Get()
  async getAllTimes(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    try {
      const vehicles = (await this.associationService.getVehiclesByUserRole(
        req.user.id,
      )) as VehicleEntity[];
      if (!vehicles || vehicles.length === 0) {
        return res.status(404).json({ message: 'Nessun Veicolo associato' });
      }
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const times = await this.realtimeService.getTimesByVeId(vehicleIds);
      if (times.length > 0) res.status(200).json(times);
      else
        res.status(404).json({
          message: 'Nessun realtime recuperato',
        });
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).json({ message: 'Errore nel recupero dei realtimes' });
    }
  }

  /**
   * Recupera l'ultimo realtime disponibile di tutti i veicoli in base all'utente
   * @param req User
   * @param res
   * @returns
   */
  @Get('last')
  async getLast(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    try {
      const vehicles = (await this.associationService.getVehiclesByUserRole(
        req.user.id,
      )) as VehicleEntity[];
      if (!vehicles || vehicles.length === 0) {
        return res.status(404).json({ message: 'Nessun Veicolo associato' });
      }
      const latestRealtimes = [];
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      for (const id of vehicleIds) {
        const key = `realtime:${id}`;
        latestRealtimes.push(JSON.parse(await this.redis.get(key)));
      }
      // Verifica se `latestRealtimes` è vuoto
      if (latestRealtimes.length === 0) {
        return res
          .status(404)
          .json({ message: 'Nessun dato trovato per i veicoli richiesti.' });
      }
      res.status(200).json(latestRealtimes);
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).json({ message: 'Errore nel recupero dei realtimes' });
    }
  }

  /**
   * Fa una chiamata al servizio SOAP per recuperare i realtimes in base al vgId
   * @param res
   * @param params vgId identificativo del gruppo
   */
  @Get('update')
  async updateRealtime(@Res() res: Response) {
    try {
      await this.realtimeService.clearRealtime();
      console.log(
        'Aggiornamento Realtime richiesto alle: ' + new Date().toISOString(),
      );
      const realtimePromises = [
        this.realtimeService.setRealtime(254, 313), // Gesenu principale
        this.realtimeService.setRealtime(305, 650), // TSA principale
        this.realtimeService.setRealtime(324, 688), // Fiumicino principale
      ];
      const results = await Promise.all(realtimePromises);
      // Controlla se almeno una delle chiamate è andata a buon fine
      const allUpdated = results.some((result) => result);
      const vehicles = await this.vehicleService.getAllVehicles();
      if (!vehicles) {
        res.status(404).json({ message: 'Nessun aggiornamento disponibile' });
      }
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const realtimes = await this.realtimeService.getTimesByVeId(vehicleIds);
      const latestRealtimes =
        await this.realtimeService.calculateLastValid(realtimes);
      await this.realtimeService.setLastValidRedis(latestRealtimes);
      if (allUpdated) {
        res
          .status(200)
          .json({ message: 'Aggiornamento completato con successo' });
      } else {
        res.status(404).json({ message: 'Nessun aggiornamento disponibile' });
      }
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      res
        .status(500)
        .json({ message: 'Errore durante la richiesta al servizio SOAP' });
    }
  }

  /**
   * Recupera i realtime in base al veId
   * @param res
   * @param params veId Identificativo del veicolo
   */
  @Post()
  async getTimeByVeId(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() body: { veId: number },
  ) {
    try {
      const vehicles = (await this.associationService.getVehiclesByUserRole(
        req.user.id,
      )) as VehicleEntity[];

      if (!vehicles || !Array.isArray(vehicles)) {
        return res.status(404).json({ message: 'Nessun Veicolo associato' });
      }
      const times = await this.realtimeService.getTimesByVeId([body.veId]);
      if (!times || times.length === 0) {
        return res.status(404).json({
          message: `Nessun realtime recuperato per Veicolo: ${body.veId}`,
        });
      }

      const vehicle = vehicles.find(
        (element) => element.veId === Number(body.veId),
      );

      if (!vehicle) {
        return res.status(404).json({
          message: `Non hai i permessi per visualizzare il veicolo con VeId: ${body.veId}`,
        });
      }

      res.status(200).json(times);
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res.status(500).json({ message: 'Errore nel recupero dei realtimes' });
    }
  }

  /**
   * API che restituisce la via posizione in base alle coordinate salvandola in cache su Redis
   * @param res VeId del veicolo
   * @param params
   */
  @Get('resolve/:veId')
  async getResolvedByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const times = await this.realtimeService.getTimesByVeId(params.veId);
      const response = [];
      for (const time of times) {
        const cacheKey = `pos:${time.latitude}:${time.longitude}`;
        let position = await this.redis.get(cacheKey);
        if (!position) {
          const pos = await axios.get(this.nominatimUrl, {
            params: {
              lat: time.latitude,
              lon: time.longitude,
              format: 'json',
            },
          });
          position = pos.data.display_name;
          await this.redis.set(cacheKey, position, 'EX', 86400);
        }

        response.push(position);
      }
      if (response.length > 0) res.status(200).json(response);
      else res.status(404).json({ message: 'Nessuna posizione registrata' });
    } catch (error) {
      console.error('Errore nel recupero dei realtimes:', error);
      res
        .status(500)
        .json({ message: 'Errore durante il recupero dei realtimes' });
    }
  }
}
