import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { Role } from 'classes/enum/role.enum';
import { UserFromToken } from 'classes/interfaces/userToken.interface';
import { Request, Response } from 'express';
import Redis from 'ioredis';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { VehicleService } from 'src/services/vehicle/vehicle.service';
import { AnomalyService } from './../../services/anomaly/anomaly.service';
import { AssociationService } from './../../services/association/association.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('anomaly')
@Roles(Role.Admin, Role.Responsabile, Role.Capo)
export class AnomalyController {
  constructor(
    private readonly anomalyService: AnomalyService,
    private readonly associationService: AssociationService,
    private readonly vehicleService: VehicleService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Ritorna tutte le anomalie salvate
   * @param res oggetto costruito soltanto con le informazioni necessarie
   */
  @Get()
  async getAllAnomaly(
    // Necessario per recuperare user dalla richiesta e non dare errore in compilazione
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
  ) {
    const vehicles = (await this.associationService.getVehiclesByUserRole(
      req.user.id,
    )) as VehicleEntity[];
    if (vehicles) {
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const datas = await this.anomalyService.getAllAnomaly(vehicleIds);
      if (datas.length > 0) {
        const vehicleMap = new Map();

        datas.forEach((data) => {
          const veId = data.vehicle.veId;

          if (!vehicleMap.has(veId)) {
            // First time seeing this vehicle, create initial entry
            vehicleMap.set(veId, {
              plate: data.vehicle.plate,
              veId: data.vehicle.veId,
              isCan: data.vehicle.isCan,
              anomaliaSessione: data.session || null,
              isRFIDReader: data.vehicle.isRFIDReader,
              sessions: [],
            });
          }

          // Add session to the vehicle's sessions
          const vehicle = vehicleMap.get(veId);
          vehicle.sessions.push({
            date: data.date,
            anomalies: {
              Antenna: data.antenna || null,
              GPS: data.gps || null,
            },
          });
        });

        // Convert map to array
        const vehicles = Array.from(vehicleMap.values());

        res.status(200).json(vehicles);
      } else {
        res.status(404).json({ message: 'Nessuna anomalia trovata' });
      }
    } else
      res.status(404).json({ message: 'Nessuna veicolo associato al utente' });
  }

  /**
   * API che ritorna tutti i veicoli con il relativo andamento delle anomalie
   * @param req recupero utente dal token
   * @param res
   * @param body data di inizio e fine ricerca
   * @returns
   */
  @Post()
  async getAnomalyByDate(
    @Req() req: Request & { user: UserFromToken },
    @Res() res: Response,
    @Body() body: { dateFrom: string; dateTo: string },
  ) {
    try {
      if (!body.dateFrom) {
        return res
          .status(400)
          .json({ message: 'Inserisci una data di inizio' });
      }

      // Prendo i veicoli dall'utente
      const vehicles = (await this.associationService.getVehiclesByUserRole(
        req.user.id,
      )) as VehicleEntity[];
      if (!vehicles.length) {
        return res.status(404).json({ message: 'Nessun veicolo associato' });
      }

      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const dateFrom = new Date(body.dateFrom);
      let lastUpdate;
      let anomalies: any[] = [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (!body.dateTo) {
        return res.status(400).json({
          message: 'Inserisci una data di fine',
        });
      }
      const dateTo = new Date(body.dateTo);
      if (dateTo < dateFrom) {
        return res.status(400).json({
          message: 'La data di fine deve essere successiva alla data di inizio',
        });
      }
      // Case 1: Se dateFrom === dateTo e il giorno è oggi usare todayAnomaly
      if (dateFrom.getTime() === dateTo.getTime()) {
        if (dateFrom.getTime() === today.getTime()) {
          lastUpdate = await this.redis.get('todayAnomaly:lastUpdate');
          const redisPromises = vehicleIds.map(async (id) => {
            const key = `todayAnomaly:${id}`;
            try {
              const data = await this.redis.get(key);
              return data ? JSON.parse(data) : null;
            } catch (error) {
              console.error(
                `Errore recupero da redis il veicolo ${id}:`,
                error,
              );
              return null;
            }
          });
          anomalies = (await Promise.all(redisPromises)).filter(Boolean);
        } else {
          anomalies = await this.anomalyService.getAnomalyByDate(
            vehicleIds,
            dateFrom,
          );
        }
      }
      // Case 2: Se dateFrom è ieri e il dateTo è oggi usa dayBeforeAnomaly
      else if (
        dateFrom.getTime() === yesterday.getTime() &&
        dateTo.getTime() === today.getTime()
      ) {
        const redisPromises = vehicleIds.map(async (id) => {
          const key = `dayBeforeAnomaly:${id}`;
          try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
          } catch (error) {
            console.error(`Errore recupero da redis il veicolo ${id}:`, error);
            return null;
          }
        });
        anomalies = (await Promise.all(redisPromises)).filter(Boolean);
      }
      // Case 3: Se nessuno dei caso è true fa getAnomalyByDateRange
      else {
        anomalies = await this.anomalyService.getAnomalyByDateRange(
          vehicleIds,
          dateFrom,
          dateTo,
        );
      }

      // Esegui operazioni direttamente sulle anomalie, ordinandole per data
      const processedAnomalies = anomalies.map((entry) => ({
        plate: entry.vehicle.plate,
        veId: entry.vehicle.veId,
        isRFIDReader: entry.vehicle.isRFIDReader,
        anomalies: entry.anomalies.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
      }));

      // Restituisci il risultato
      return res.status(200).json({
        lastUpdate,
        vehicles: processedAnomalies,
      });
    } catch (error) {
      console.error('Errore durante il recupero delle anomalie:', error);
      return res.status(500).json({
        message: 'Errore durante il recupero delle anomalie',
      });
    }
  }
  /**
   * API per i controlli dei mezzi in base al range temporale
   * @param res
   * @param body
   */
  @Post('checkerrors')
  async checkErrors(@Res() res: Response, @Body() body) {
    const data = await this.anomalyService.checkErrors(
      body.dateFrom,
      body.dateTo,
    );
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ message: 'No data' });
    }
  }

  /**
   * Funzione API che permette il ricalcolo delle anomalie per la giornata odierna e,
   * una volta popolato il database, imposta i nuovi risultati su redis di oggi e ieri
   * @param res
   * @returns
   */
  @Get('updatetoday')
  async updateTodayAnomaly(@Res() res: Response) {
    try {
      const datefrom = new Date();
      const dateto = new Date(datefrom);
      datefrom.setHours(0, 0, 0, 0);
      dateto.setDate(dateto.getDate() + 1);
      const data = await this.anomalyService.checkErrors(
        datefrom.toISOString(),
        dateto.toISOString(),
      );
      if (!data || data.length === 0)
        return res.status(404).json({ message: 'No data' });
      const anomalyPromises = data.flatMap((item) => {
        const veId = item.veId;
        let date = null;
        let gps = null;
        let antenna = null;
        const session = item.anomaliaSessione || null;

        if (item.sessions && item.sessions[0]) {
          date = item.sessions[0].date || null;
          if (item.sessions[0].anomalies) {
            gps = item.sessions[0].anomalies.GPS || null;
            antenna = item.sessions[0].anomalies.Antenna || null;
          }
        }

        return this.anomalyService.createAnomaly(
          veId,
          date,
          gps,
          antenna,
          session,
        );
      });

      await Promise.all(anomalyPromises);

      const keys = await this.redis.keys('*Anomaly:*');
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
      const vehicles = await this.vehicleService.getAllVehicles();
      const vehicleIds = vehicles.map((vehicle) => vehicle.veId);
      const now = new Date();
      const dayBefore = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1,
      );
      const yesterdayAnomalies = await this.anomalyService.getAnomalyByDate(
        vehicleIds,
        dayBefore,
      );
      const todayAnomalies = await this.anomalyService.getAnomalyByDate(
        vehicleIds,
        now,
      );
      await this.anomalyService.setDayBeforeAnomalyRedis(yesterdayAnomalies);
      await this.anomalyService.setTodayAnomalyRedis(todayAnomalies);

      res.status(200).json({ message: 'Anomalie odierne aggiornate' });
    } catch (error) {
      console.error(
        'Errore durante aggiornamento delle anomalie odierne:',
        error,
      );
      return res.status(500).json({
        message: 'Errore durante aggiornamento delle anomalie odierne',
      });
    }
  }
}
