import { Controller, Post, Res, Param, Body, Get } from '@nestjs/common';
import { SessionEntity } from 'classes/entities/session.entity';
import { TagEntity } from 'classes/entities/tag.entity';
import { TagHistoryEntity } from 'classes/entities/tag_history.entity';
import { VehicleEntity } from 'classes/entities/vehicle.entity';
import { Response } from 'express';
import { SessionService } from 'src/services/session/session.service';
import { TagService } from 'src/services/tag/tag.service';
import { VehicleService } from 'src/services/vehicle/vehicle.service';
import { getDaysInRange, validateDateRange } from 'src/utils/utils';

@Controller('session')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly tagService: TagService,
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
      res.status(500).json({
        message: 'Errore nella ricerca della sessione del veicolo.',
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
      sessions
        ? res.status(200).json(sessions)
        : res.status(404).json({ message: 'No last session found' });
    } catch (error) {
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
      res.status(500).json({
        message: 'Errore nel recupero della sessione attiva',
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
      res.status(500).json({
        message: 'Errore nel recupero delle sessioni con range temporale',
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
  @Post('ranged/:id')
  async getAllSessionByVeIdRanged(
    @Res() res: Response,
    @Param() params: any,
    @Body() body: any,
  ) {
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
        params.id,
        dateFrom_new,
        dateTo_new,
      );
      if (data.length > 0) {
        res.status(200).json(data);
      } else
        res.status(404).json({ message: `No Session per id: ${params.id}` });
    } catch (error) {
      res.status(500).json({
        message: 'Errore nel recupero delle sessioni con range temporale',
      });
    }
  }

  /**
   * Controllo tutte le sessioni di tutti i veicoli, per marcare quelle con dei malfunzionamenti al GPS
   * @param res Ritorno tutti i veicoli con almeno 1 sessione nel range temporale
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  @Post('checkgps/all')
  async checkSessionGPSAll(@Res() res: Response, @Body() body: any) {
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;

    // controllo data valida
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return res.status(400).json(validation.message);
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const vehicles = await this.vehicleService.getAllVehicles();
    const anomaliesForAllVehicles = await Promise.all(
      vehicles.map(async (vehicle: VehicleEntity) => {
        const vehicleCheck = {
          plate: vehicle.plate,
          veId: vehicle.veId,
          isCan: vehicle.isCan,
          isRFIDReader: vehicle.isRFIDReader,
          sessions: [],
        };
        // Raccogli le anomalie per ogni veicolo
        const anomaliesForVehicle = await Promise.all(
          daysInRange.slice(0, -1).map(async (day) => {
            const datefrom = day;
            const dateto = new Date(datefrom);
            dateto.setHours(23, 59, 59, 0);

            const datas = await this.sessionService.getAllSessionByVeIdRanged(
              vehicle.veId,
              datefrom,
              dateto,
            );
            if (datas.length > 0) {
              let flag_distance_can = false;
              let flag_distance = false;
              let flag_coordinates = false;
              let flag_coordinates_zero = false;

              const sessions = {
                date: day,
                anomalies: [],
              };

              const distanceMap = datas.map((data) => data.distance);
              // le coordinate riguardano il numero di history in tutte le sessioni di quella giornata
              const coordinates = datas.flatMap((data) =>
                data.history.map((entry) => ({
                  latitude: entry.latitude,
                  longitude: entry.longitude,
                })),
              );
              if (coordinates.length > 4) {
                if (vehicle.isCan) {
                  if (distanceMap.every((distance) => distance === 0)) {
                    flag_distance_can = true;
                  }
                  if (
                    coordinates.every(
                      (coord) =>
                        coord.latitude === coordinates[0].latitude &&
                        coord.longitude === coordinates[0].longitude,
                    )
                  ) {
                    flag_coordinates = true;
                  }
                  const zeroCoordinatesCount = coordinates.filter(
                    (coord) => coord.latitude === 0 && coord.longitude === 0,
                  ).length;
                  if (zeroCoordinatesCount > coordinates.length * 0.2) {
                    flag_coordinates_zero = true;
                  }
                } else {
                  if (
                    distanceMap.every(
                      (distance) => distance === distanceMap[0],
                    ) ||
                    distanceMap.every((distance) => distance === 0)
                  ) {
                    flag_distance = true;
                  }
                  if (
                    coordinates.every(
                      (coord) =>
                        coord.latitude === coordinates[0].latitude &&
                        coord.longitude === coordinates[0].longitude,
                    )
                  ) {
                    flag_coordinates = true;
                  }
                  const zeroCoordinatesCount = coordinates.filter(
                    (coord) => coord.latitude === 0 && coord.longitude === 0,
                  ).length;
                  if (zeroCoordinatesCount > coordinates.length * 0.2) {
                    flag_coordinates_zero = true;
                  }
                }
              }

              if (flag_coordinates && flag_distance) {
                sessions.anomalies.push(
                  `Anomalia GPS totale, distanza: ${distanceMap[0]} e lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
                );
              } else if (flag_coordinates) {
                sessions.anomalies.push(
                  `Anomalia nelle coordinate, sempre uguali a lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
                );
              } else if (flag_coordinates_zero) {
                sessions.anomalies.push(
                  `Anomalia nelle coordinate con lat: 0 e lon: 0 sopra al 20%`,
                );
              }
              if (flag_distance_can) {
                sessions.anomalies.push(
                  `Anomalia GPS per la distanza problema con il tachimetro, sempre uguale a ${distanceMap[0]}`,
                );
              }

              return sessions; // ritorna il risultato per questo giorno
            }
            return null; // Se non ci sono dati, ritorna null
          }),
        );
        const validSessions = anomaliesForVehicle.filter(
          (session) => session !== null,
        );
        vehicleCheck.sessions = validSessions;
        // Filtra i risultati nulli
        return vehicleCheck;
      }),
    );

    // Appiattisce l'array
    const allAnomalies = anomaliesForAllVehicles.flat();
    const filteredData = allAnomalies.filter(
      (item) => Array.isArray(item.sessions) && item.sessions.length > 0,
    );
    if (filteredData.length > 0)
      res.status(200).json({ vehicles: filteredData });
    else res.status(404).json({ message: 'Nessun dato trovato' });
  }

  async checkSessionGPSAllNoApi(dateFrom: Date, dateTo: Date) {
    // controllo data valida
    const validation = validateDateRange(
      dateFrom.toISOString(),
      dateTo.toISOString(),
    );
    if (!validation.isValid) {
      return validation.message;
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const vehicles = await this.vehicleService.getAllVehicles();
    const anomaliesForAllVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        const vehicleCheck = {
          plate: vehicle.plate,
          veId: vehicle.veId,
          isCan: vehicle.isCan,
          isRFIDReader: vehicle.isRFIDReader,
          sessions: [],
        };
        // Raccogli le anomalie per ogni veicolo
        const anomaliesForVehicle = await Promise.all(
          daysInRange.slice(0, -1).map(async (day) => {
            const datefrom = day;
            const dateto = new Date(datefrom);
            dateto.setHours(23, 59, 59, 0);

            const datas = await this.sessionService.getAllSessionByVeIdRanged(
              vehicle.veId,
              datefrom,
              dateto,
            );
            if (datas.length > 0) {
              let flag_distance_can = false;
              let flag_distance = false;
              let flag_coordinates = false;
              let flag_coordinates_zero = false;

              const sessions = {
                date: day,
                anomalies: [],
              };

              const distanceMap = datas.map((data) => data.distance);
              // le coordinate riguardano il numero di history in tutte le sessioni di quella giornata
              const coordinates = datas.flatMap((data) =>
                data.history.map((entry) => ({
                  latitude: entry.latitude,
                  longitude: entry.longitude,
                })),
              );
              if (coordinates.length > 4) {
                if (vehicle.isCan) {
                  if (distanceMap.every((distance) => distance === 0)) {
                    flag_distance_can = true;
                  }
                  if (
                    coordinates.every(
                      (coord) =>
                        coord.latitude === coordinates[0].latitude &&
                        coord.longitude === coordinates[0].longitude,
                    )
                  ) {
                    flag_coordinates = true;
                  }
                  const zeroCoordinatesCount = coordinates.filter(
                    (coord) => coord.latitude === 0 && coord.longitude === 0,
                  ).length;
                  if (zeroCoordinatesCount > coordinates.length * 0.2) {
                    flag_coordinates_zero = true;
                  }
                } else {
                  if (
                    distanceMap.every(
                      (distance) => distance === distanceMap[0],
                    ) ||
                    distanceMap.every((distance) => distance === 0)
                  ) {
                    flag_distance = true;
                  }
                  if (
                    coordinates.every(
                      (coord) =>
                        coord.latitude === coordinates[0].latitude &&
                        coord.longitude === coordinates[0].longitude,
                    )
                  ) {
                    flag_coordinates = true;
                  }
                  const zeroCoordinatesCount = coordinates.filter(
                    (coord) => coord.latitude === 0 && coord.longitude === 0,
                  ).length;
                  if (zeroCoordinatesCount > coordinates.length * 0.2) {
                    flag_coordinates_zero = true;
                  }
                }
              }

              if (flag_coordinates && flag_distance) {
                sessions.anomalies.push(
                  `Anomalia GPS totale, distanza: ${distanceMap[0]} e lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
                );
              } else if (flag_coordinates) {
                sessions.anomalies.push(
                  `Anomalia nelle coordinate, sempre uguali a lat: ${coordinates[0].latitude} e lon: ${coordinates[0].longitude}`,
                );
              } else if (flag_coordinates_zero) {
                sessions.anomalies.push(
                  `Anomalia nelle coordinate con lat: 0 e lon: 0 sopra al 20%`,
                );
              }
              if (flag_distance_can) {
                sessions.anomalies.push(
                  `Anomalia GPS per la distanza problema con il tachimetro, sempre uguale a ${distanceMap[0]}`,
                );
              }

              return sessions; // ritorna il risultato per questo giorno
            }
            return null; // Se non ci sono dati, ritorna null
          }),
        );
        const validSessions = anomaliesForVehicle.filter(
          (session) => session !== null,
        );
        vehicleCheck.sessions = validSessions;
        // Filtra i risultati nulli
        return vehicleCheck;
      }),
    );

    // Appiattisce l'array
    const allAnomalies = anomaliesForAllVehicles.flat();
    const filteredData = allAnomalies.filter(
      (item) => Array.isArray(item.sessions) && item.sessions.length > 0,
    );
    return filteredData; // Restituisce il risultato senza res.send
  }

  /**
   * Controllo sessioni registrate per funzionamento effettivo GPS, lat e log deve differire e la distanza deve essere variabile
   * @param res
   * @param params VeId
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  @Post('checkgps/:id')
  async checkSessionGPS(
    @Res() res: Response,
    @Param() params: any,
    @Body() body: any,
  ) {
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;

    // controllo data valida
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return res.status(400).json(validation.message);
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const datas = await this.sessionService.getAllSessionByVeIdRanged(
      params.id,
      dateFrom_new,
      dateTo_new,
    );
    if (datas.length > 1) {
      let flag_distance: boolean = false;
      let flag_coordinates: boolean = false;
      const distanceMap = datas.map((data) => data.distance);
      const coordinates = datas.flatMap((data) =>
        data.history.map((entry) => ({
          latitude: entry.latitude,
          longitude: entry.longitude,
        })),
      );
      // Verifica se tutti i valori in `distanceMap` sono uguali tra loro o a zero
      if (
        distanceMap.every((distance) => distance === distanceMap[0]) ||
        distanceMap.every((distance) => distance === 0)
      ) {
        flag_distance = true;
      }
      // Verifica se tutte le coordinate sono identiche tra loro o a (0, 0)
      if (
        coordinates.every(
          (coord) =>
            coord.latitude === coordinates[0].latitude &&
            coord.longitude === coordinates[0].longitude,
        ) ||
        coordinates.every(
          (coord) => coord.latitude === 0 && coord.longitude === 0,
        )
      ) {
        flag_coordinates = true;
      }
      if (flag_distance && flag_coordinates) {
        res.status(200).json({
          message: 'Anomalia nel GPS',
          distance: distanceMap,
          coordinates: coordinates,
        });
      } else {
        res.status(200).json(true);
      }
    } else if (datas.length === 1) {
      res
        .status(200)
        .json(
          `Soltanto 1 sessione per il controllo, selezionare un'altra data`,
        );
    } else res.status(200).json(`No Session per id: ${params.id}`);
  }

  /**
   * Ritorna per ogni veicolo se almeno un tag è stato letto in un determinato arco di tempo
   * @param res
   * @param period_from data di inizio periodo
   * @param period_to data di fine periodo
   * @returns
   */
  @Post('tagcomparisonwtime/all')
  async tagComparisonAllWithTimeRange(@Res() res: Response, @Body() body: any) {
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;

    // controllo data valida
    const validation = validateDateRange(dateFrom, dateTo);
    if (!validation.isValid) {
      return res.status(400).json(validation.message);
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const allVehicles = await this.vehicleService.getVehiclesByReader(); //prendi tutti i veicoli che hanno un antenna RFID

    // Get the latest tag read for all vehicles
    const anomaliesForAllVehicles = await Promise.all(
      allVehicles.map(async (vehicle) => {
        const vehicleCheck = {
          plate: vehicle.plate,
          veId: vehicle.veId,
          isCan: vehicle.isCan,
          isRFIDReader: vehicle.isRFIDReader,
          sessions: [],
        };
        const anomaliesForVehicle = await Promise.all(
          daysInRange.slice(0, -1).map(async (day) => {
            const datefrom = day;
            const dateto = new Date(datefrom);
            dateto.setHours(23, 59, 59, 0);
            const lastTag: TagHistoryEntity =
              await this.tagService.getLastTagHistoryByVeIdRanged(
                vehicle.veId,
                datefrom,
                dateto,
              );
            const listSession: SessionEntity[] =
              await this.sessionService.getAllSessionByVeIdRanged(
                vehicle.veId,
                datefrom,
                dateto,
              );
            const filteredSessions: SessionEntity[] = listSession.filter(
              (session) => session.history.length >= 2,
            );
            const sessions = {
              date: day,
              anomalies: [],
            };
            // se nessun tag e sessione trovata stop ricerca
            if (!lastTag && filteredSessions.length === 0) {
              return null;
            }
            // se ci stano sessioni ma no tag, errore
            if (!lastTag && filteredSessions.length > 0) {
              sessions.anomalies.push(
                `Anomalia antenna, sessioni trovate ma no tag letti.`,
              );
            }
            // se ci sta un tag ma no sessioni, errore
            if (lastTag && filteredSessions.length === 0) {
              sessions.anomalies.push(
                `Anomalia antenna, tag letto ma nessuna sessione trovata.`,
              );
            }
            return sessions;
          }),
        );
        const validSessions = anomaliesForVehicle.filter(
          (session) => session !== null,
        );
        vehicleCheck.sessions = validSessions;
        return vehicleCheck;
      }),
    );
    const allAnomalies = anomaliesForAllVehicles.flat();
    const filteredData = allAnomalies.filter(
      (item) => Array.isArray(item.sessions) && item.sessions.length > 0,
    );
    //controllo se esistono sessioni
    if (filteredData) {
      res.status(200).json({ vehicles: filteredData });
    } else {
      res.status(404).json({
        sessionFound: false,
      });
    }
  }

  /**
   * Ritorna per ogni veicolo se almeno un tag è stato letto in un determinato arco di tempo, senza API
   * @param period_to data di inizio periodo
   * @param period_from data di fine periodo
   * @returns
   */
  async tagComparisonAllWithTimeRangeNoApi(dateFrom: Date, dateTo: Date) {
    // controllo data valida
    const validation = validateDateRange(
      dateFrom.toISOString(),
      dateTo.toISOString(),
    );
    if (!validation.isValid) {
      return validation.message;
    }
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    const daysInRange = getDaysInRange(dateFrom_new, dateTo_new);
    const allVehicles = await this.vehicleService.getVehiclesByReader(); //prendi tutti i veicoli che hanno un antenna RFID

    // Get the latest tag read for all vehicles
    const anomaliesForAllVehicles = await Promise.all(
      allVehicles.map(async (vehicle) => {
        const vehicleCheck = {
          plate: vehicle.plate,
          veId: vehicle.veId,
          isCan: vehicle.isCan,
          isRFIDReader: vehicle.isRFIDReader,
          sessions: [],
        };
        const anomaliesForVehicle = await Promise.all(
          daysInRange.slice(0, -1).map(async (day) => {
            const datefrom = day;
            const dateto = new Date(datefrom);
            dateto.setHours(23, 59, 59, 0);
            const lastTag: TagHistoryEntity =
              await this.tagService.getLastTagHistoryByVeIdRanged(
                vehicle.veId,
                datefrom,
                dateto,
              );
            const listSession: SessionEntity[] =
              await this.sessionService.getAllSessionByVeIdRanged(
                vehicle.veId,
                datefrom,
                dateto,
              );
            const filteredSessions: SessionEntity[] = listSession.filter(
              (session) => session.history.length >= 2,
            );
            const sessions = {
              date: day,
              anomalies: [],
            };
            // se nessun tag e sessione trovata stop ricerca
            if (!lastTag && filteredSessions.length === 0) {
              return null;
            }
            // se ci stano sessioni ma no tag, errore
            if (!lastTag && filteredSessions.length > 0) {
              sessions.anomalies.push(
                `Anomalia antenna, sessioni trovate ma no tag letti.`,
              );
            }
            // se ci sta un tag ma no sessioni, errore
            if (lastTag && filteredSessions.length === 0) {
              sessions.anomalies.push(
                `Anomalia antenna, tag letto ma nessuna sessione trovata.`,
              );
            }
            return sessions;
          }),
        );
        const validSessions = anomaliesForVehicle.filter(
          (session) => session !== null,
        );
        vehicleCheck.sessions = validSessions;
        return vehicleCheck;
      }),
    );
    const allAnomalies = anomaliesForAllVehicles.flat();
    const filteredData = allAnomalies.filter(
      (item) => Array.isArray(item.sessions) && item.sessions.length > 0,
    );

    if (filteredData) {
      return filteredData;
    } else {
      return false;
    }
  }

  /**
   * Ritorna se almeno un tag è stato letto in un determinato arco di tempo
   * @param period_from data di inizio ricerca
   * @param period_to data di fine ricerca
   * @param params id del veicolo
   * @param res {veId: vehicleId, lastTag: lastTag}
   */
  @Post('tagcomparisonwtime/:id')
  async tagComparisonWithTimeRange(
    @Res() res: Response,
    @Param() params: any,
    @Body('period_from') period_from: Date,
    @Body('period_to') period_to: Date,
  ) {
    const vehicleId = params.id;
    const sessions = await this.sessionService.getSessionInTimeRange(
      period_from,
      period_to,
    );
    const lastTag = await this.tagService.getLastTagInTimeRange(
      period_from,
      period_to,
      vehicleId,
    );
    if (!sessions) {
      res.status(400).json({
        sessionFound: false,
      });
    }
    if (!lastTag) {
      res.status(400).json({
        veId: vehicleId,
        lastTag: false,
      });
    }
    if (sessions && lastTag) {
      res.status(200).json({
        veId: vehicleId,
        lastTag: lastTag,
      });
    }
  }

  /**
   * Ritorna tutti i veicoli dove la data dell'ultima sessione non corrisponde all ultimo evento registrato
   * @param res
   */
  @Get('lastevent/all')
  async lastEventComparisonAll(@Res() res: Response) {
    try {
      const vehicles = await this.vehicleService.getAllVehicles();

      // Recupero le ultime sessioni per tutti i veicoli in parallelo
      const sessions = await Promise.all(
        vehicles.map((vehicle) =>
          this.sessionService.getLastSession(vehicle.veId),
        ),
      );
      // reduce accumulare gli elementi con anomalie
      const brokenVehicles = vehicles.reduce((acc, vehicle, index) => {
        const lastSession = sessions[index]; // Associo la sessione al veicolo corrente
        if (lastSession) {
          const lastVehicleEventTime = new Date(vehicle.lastEvent).getTime();
          const sessionEndTime = new Date(lastSession.period_to).getTime();
          // Calcola la differenza in giorni tra lastVehicleEvent e sessionEnd
          const diffInDays = Math.floor(
            (sessionEndTime - lastVehicleEventTime) / (1000 * 60 * 60 * 24),
          );
          if (diffInDays >= 1) {
            acc.push({
              plate: vehicle.plate,
              veId: vehicle.veId,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.isRFIDReader,
              anomalies:
                'Anomalia: ultima sessione non è stata chiusa correttamente',
            });
          } else if (lastVehicleEventTime > sessionEndTime) {
            acc.push({
              plate: vehicle.plate,
              veId: vehicle.veId,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.isRFIDReader,
              anomalies: 'Anomalia: è presente una sessione nulla',
            });
          }
        }
        return acc;
      }, []);

      if (brokenVehicles.length > 0) {
        res.status(200).json({ vehicles: brokenVehicles });
      } else {
        res.status(200).json({
          message: 'Nessun veicolo presenta incongruenze',
        });
      }
    } catch (error) {
      console.error('Error getting last event: ', error);
      res.status(500).json('Errore durante la richiesta al db');
    }
  }

  async lastEventComparisonAllNoApi() {
    try {
      const vehicles = await this.vehicleService.getAllVehicles();

      // Recupero le ultime sessioni per tutti i veicoli in parallelo
      const sessions = await Promise.all(
        vehicles.map((vehicle) =>
          this.sessionService.getLastSession(vehicle.veId),
        ),
      );
      // reduce accumulare gli elementi con anomalie
      const brokenVehicles = vehicles.reduce((acc, vehicle, index) => {
        const lastSession = sessions[index]; // Associo la sessione al veicolo corrente
        if (lastSession) {
          const lastVehicleEventTime = new Date(vehicle.lastEvent).getTime();
          const sessionEndTime = new Date(lastSession.period_to).getTime();
          // Calcola la differenza in giorni tra lastVehicleEvent e sessionEnd
          const diffInDays = Math.floor(
            (sessionEndTime - lastVehicleEventTime) / (1000 * 60 * 60 * 24),
          );
          if (diffInDays >= 1) {
            acc.push({
              plate: vehicle.plate,
              veId: vehicle.veId,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.isRFIDReader,
              anomalies:
                'Anomalia: ultima sessione non è stata chiusa correttamente',
            });
          } else if (lastVehicleEventTime > sessionEndTime) {
            acc.push({
              plate: vehicle.plate,
              veId: vehicle.veId,
              isCan: vehicle.isCan,
              isRFIDReader: vehicle.isRFIDReader,
              anomalies: 'Anomalia: è presente una sessione nulla',
            });
          }
        }
        return acc;
      }, []);

      if (brokenVehicles.length > 0) {
        return brokenVehicles;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error getting last event: ', error);
      return 'Errore durante la richiesta al db'; // Return error message as string
    }
  }

  /**
   * Ritorna tutti i veicoli dove la data dell'ultima sessione non corrisponde all ultimo evento registrato in un arco di tempo
   * @param res
   */
  @Post('lasteventall/ranged')
  async lastEventComparisonAllRanged(
    @Res() res: Response,
    @Body('dateFrom') dateFrom,
    @Body('dateTo') dateTo,
  ) {
    try {
      const brokenVehicles = [];
      const vehicles = await this.vehicleService.getVehiclesByReader();
      for (const vehicle of vehicles) {
        const lastSession =
          await this.sessionService.getLastSessionByVeIdRanged(
            vehicle.veId,
            new Date(dateFrom),
            new Date(dateTo),
          );
        if (lastSession) {
          const lastVehicleEvent = vehicle.lastEvent;
          const sessionEnd = lastSession.period_to;
          if (
            new Date(lastVehicleEvent).getTime() !=
            new Date(sessionEnd).getTime()
          ) {
            brokenVehicles.push(vehicle);
            // console.log({
            //   message:
            //     "L'ultimo evento del veicolo NON corrisponde con la fine della sua ultima sessione.",
            //   lastVehicleEvent,
            //   sessionEnd,
            // });
          }
        }
      }
      if (brokenVehicles.length > 0) {
        res.status(200).json({
          message:
            "Veicoli dove l'ultima sessione non corrisponde all'ultimo evento registrato",
          brokenVehicles,
        });
      } else {
        res.status(200).json({
          message: 'Nessun veicolo presenta incongruenze',
        });
      }
    } catch (error) {
      console.error('Error getting last event: ', error);
      res.status(500).json('Errore durante la richiesta al db');
    }
  }

  async lastEventComparisonAllRangedNoApi(dateFrom: Date, dateTo: Date) {
    try {
      const brokenVehicles = [];
      const vehicles = await this.vehicleService.getVehiclesByReader();
      for (const vehicle of vehicles) {
        const lastSession =
          await this.sessionService.getLastSessionByVeIdRanged(
            vehicle.veId,
            dateFrom,
            dateTo,
          );
        if (lastSession) {
          const lastVehicleEvent = vehicle.lastEvent;
          const sessionEnd = lastSession.period_to;
          if (
            new Date(lastVehicleEvent).getTime() !=
            new Date(sessionEnd).getTime()
          ) {
            brokenVehicles.push(vehicle);
          }
        }
      }

      if (brokenVehicles.length > 0) {
        return {
          message:
            "Veicoli dove l'ultima sessione non corrisponde all'ultimo evento registrato",
          errors: brokenVehicles as any[],
        };
      } else {
        return { message: 'Nessun veicolo presenta incongruenze' };
      }
    } catch (error) {
      console.error('Error getting last event: ', error);
      return 'Errore durante la richiesta al db'; // Return error message as string
    }
  }

  @Get('lastevent/:id')
  async lastEventComparisonById(@Res() res: Response, @Param() params: any) {
    try {
      const lastVehicle = await this.vehicleService.getVehicleById(params.id);
      const lastSession = await this.sessionService.getLastSession(params.id);
      if (lastVehicle && lastSession) {
        const lastVehicleEvent = lastVehicle.lastEvent;
        const sessionEnd = lastSession.period_to;
        if (
          new Date(lastVehicleEvent).getTime() == new Date(sessionEnd).getTime()
        ) {
          res.status(200).json({
            message:
              "L'ultimo evento del veicolo corrisponde con la fine della sua ultima sessione.",
          });
        } else {
          res.status(200).json({
            message:
              "L'ultimo evento del veicolo NON corrisponde con la fine della sua ultima sessione.",
            lastVehicleEvent,
            sessionEnd,
          });
        }
      } else {
        res.status(404).json('Veicolo non trovato id:' + params.id);
      }
    } catch (error) {
      console.error('Error getting last event: ', error);
      res.status(500).json('Errore durante la richiesta al db');
    }
  }
  /**
   * Chiamata principale per il controllo delle 3 anomalie principali
   * @param res
   * @param body Data inizio e fine controllo
   */
  @Post('checkerrors/all')
  async checkErrorsAll(@Res() res: Response, @Body() body) {
    const dateFrom = new Date(body.dateFrom);
    const dateTo = new Date(body.dateTo);

    let gpsErrors: any; //risultati controllo gps
    let fetchedTagComparisons: any; //risultati comparazione tag x controllo errori antenna
    let comparison: any; //controllo errori lastEvent
    const mergedData = [];
    /*controlla errore di GPS*/
    try {
      gpsErrors = await this.checkSessionGPSAllNoApi(dateFrom, dateTo); //restituisce dei veicoli custom con alcuni dati e un array di anomalie, in cui ci mette quelle di GPS se presenti
      gpsErrors = Array.isArray(gpsErrors) ? gpsErrors : [];
    } catch (error) {
      console.error('Errore nel controllo errori del GPS: ' + error);
      res.status(500).json({ message: 'Errore nel controllo errori del GPS.' });
    }

    /*controlla errore antenna*/
    try {
      fetchedTagComparisons = await this.tagComparisonAllWithTimeRangeNoApi(
        dateFrom,
        dateTo,
      );
      fetchedTagComparisons = Array.isArray(fetchedTagComparisons)
        ? fetchedTagComparisons
        : [];
    } catch (error) {
      console.error(
        'Errore nella comparazione dei tag per controllare gli errori delle antenne: ' +
          error,
      );
      res.status(500).json({
        message:
          'Errore nella comparazione dei tag per controllare gli errori delle antenne.',
      });
    }

    //controlla errore inizio e fine sessione (last event)
    try {
      comparison = await this.lastEventComparisonAllNoApi();
      comparison = Array.isArray(comparison) ? comparison : [];
    } catch (error) {
      console.error('Errore nel controllo del last event: ' + error);
      res.status(500).json({ message: 'Errore nel controllo del last event.' });
    }
    try {
      const allPlates = new Set([
        ...gpsErrors.map((item) => item.plate),
        ...fetchedTagComparisons.map((item) => item.plate),
        ...comparison.map((item) => item.plate),
      ]);

      allPlates.forEach((plate) => {
        const gpsEntry = gpsErrors.find((item) => item.plate === plate) || {};
        const tagEntry =
          fetchedTagComparisons.find((item) => item.plate === plate) || {};
        const comparisonEntry =
          comparison.find((item) => item.plate === plate) || {};

        // Combina tutte le sessioni in base alla data
        const allSessions = new Map();

        // Aggiungi sessioni GPS
        (gpsEntry.sessions || []).forEach((session) => {
          if (!allSessions.has(session.date)) {
            allSessions.set(session.date, {
              date: session.date,
              anomalies: {},
            });
          }
          allSessions.get(session.date).anomalies.GPS = session.anomalies?.[0];
        });

        // Aggiungi sessioni Antenna
        (tagEntry.sessions || []).forEach((session) => {
          if (!allSessions.has(session.date)) {
            allSessions.set(session.date, {
              date: session.date,
              anomalies: {},
            });
          }
          allSessions.get(session.date).anomalies.Antenna =
            session.anomalies?.[0];
        });

        const combinedMap = new Map();

        allSessions.forEach((value, key) => {
          // Usando toISOString per avere una chiave comparabile
          const dateKey = key.toISOString();

          if (combinedMap.has(dateKey)) {
            // Se la data è già presente, combiniamo le anomalie
            const existingValue = combinedMap.get(dateKey);
            existingValue.anomalies = {
              ...existingValue.anomalies,
              ...value.anomalies,
            };
            combinedMap.set(dateKey, existingValue);
          } else {
            // Se la data non esiste, la aggiungiamo
            combinedMap.set(dateKey, value);
          }
        });

        // Trasforma le sessioni in array unificando le anomalie per ciascuna data
        const unifiedSessions = Array.from(combinedMap.values());
        unifiedSessions.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        mergedData.push({
          plate,
          veId: gpsEntry.veId || tagEntry.veId || comparisonEntry.veId || null,
          isCan:
            gpsEntry.isCan || tagEntry.isCan || comparisonEntry.isCan || false,
          isRFIDReader:
            gpsEntry.isRFIDReader ||
            tagEntry.isRFIDReader ||
            comparisonEntry.isRFIDReader ||
            false,
          anomaliaSessione: comparisonEntry.anomalies,
          sessions: unifiedSessions,
        });
      });
      mergedData.sort((a, b) => a.plate.localeCompare(b.plate));
    } catch (error) {
      console.error(
        'Errore nella formattazione della risposta per le anomalie: ',
        error,
      );
      res.status(500).json({
        message: 'Errore nella formattazione della risposta per le anomalie.',
      });
    }
    // risposta
    if (mergedData.length > 0) {
      res.status(200).json(mergedData);
    } else {
      res
        .status(404)
        .json({ message: 'Nessun dato trovato per fare controlli' });
    }
  }
}
