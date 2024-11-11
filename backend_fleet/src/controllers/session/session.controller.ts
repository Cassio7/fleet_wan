import { Controller, Post, Res, Param, Body, Get } from '@nestjs/common';
import { Response } from 'express';
import { SessionService } from 'src/services/session/session.service';
import { TagService } from 'src/services/tag/tag.service';
import { VehicleService } from 'src/services/vehicle/vehicle.service';

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
          } else {
            console.log(active.session_id);
          }
        }
      }
      res.status(200).send({
        message: 'Veicoli in movimento con sessione attiva',
        session: realActive,
      });
    } else {
      res.status(404).send({ message: 'No sessioni attive' });
    }
  }
  /**
   * API per prendere tutte le sessioni in base all'id
   * @param res
   * @param params
   */
  @Get(':id')
  async getAllSessionByVeId(@Res() res: Response, @Param() params: any) {
    const data = await this.sessionService.getAllSessionByVeId(params.id);
    if (data.length > 0) {
      res.status(200).send(data);
    } else res.status(200).send(`No Session per id: ${params.id}`);
  }
  /**
   * API per prendere l'ultima sessione in base all'id
   * @param res
   * @param params VeId identificativo Veicolo
   */
  @Get('last/:id')
  async getLastSession(@Res() res: Response, @Param() params: any) {
    const data = await this.sessionService.getLastSession(params.id);
    if (data) res.status(200).send(data);
    else res.status(200).send(`No Session per id: ${params.id}`);
  }

  /**
   * API che restituisce la sessione attiva se, la fine è maggiore dell'ultima sessione, quindi veicolo in movimento.
   * @param res
   * @param params VeId identificativo Veicolo
   */
  @Get('active/:id')
  async getActiveSessionByVeId(@Res() res: Response, @Param() params: any) {
    const active = await this.sessionService.getActiveSessionByVeId(params.id);
    const last = await this.sessionService.getLastSession(params.id);
    if (!active) {
      res
        .status(200)
        .send(`Nessuna sessione attiva registrata per id: ${params.id}`);
    } else if (!last) {
      res.status(200).send(`No Session per id: ${params.id}`);
    } else {
      const firstDate = new Date(active.period_to);
      const secondDate = new Date(last.period_to);
      if (firstDate > secondDate) {
        res.status(200).send({
          message: 'Veicolo in movimento, sessione attiva',
          session: active,
        });
      } else {
        res.status(404).send({ message: 'Non attivo' });
      }
    }
  }

  /**
   * API per prendere tutte le distanze delle sessioni in base all'id
   * @param res
   * @param params
   */
  @Get('distance/:id')
  async getDistanceSession(@Res() res: Response, @Param() params: any) {
    const data = await this.sessionService.getDistanceSession(params.id);
    if (data) res.status(200).send(data);
    else res.status(200).send(`No Session per id: ${params.id}`);
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
    // Controlla se dateFrom e dateTo sono forniti
    if (!dateFrom || !dateTo) {
      return res.status(400).send('Date non fornite.');
    }

    // Crea un oggetto Date dalla stringa fornita
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    // Controlla se la data è valida
    if (isNaN(dateFrom_new.getTime()) || isNaN(dateTo_new.getTime())) {
      return res.status(400).send('Formato della data non valido.');
    }
    if (dateFrom_new.getTime() >= dateTo_new.getTime()) {
      // Restituisci un errore se la condizione è vera
      return res
        .status(400)
        .send(
          'La data iniziale deve essere indietro di almeno 1 giorno dalla finale',
        );
    }
    const data = await this.sessionService.getSessionInTimeRange(
      dateFrom_new,
      dateTo_new,
    );
    if (data.length > 0) {
      res.status(200).send(data);
    } else res.status(200).send(`No Session per id:`);
  }

  /**
   * Ritorna un array con l'ultima sessione di tutti i veicoli
   * @param res 
   */
  @Get('lastsessions/all')
  async getAllVehiclesLastSession(@Res() res: Response) {
    try {
      const vehicles = await this.vehicleService.getAllVehicles(); // Prendere tutti i veicoli
      const lastSessions = await Promise.all(
        vehicles.map(async (vehicle) => {
          return this.sessionService.getLastSession(vehicle.veId); // Per ogni veicolo, cercare l'ultima sessione
        })
      );
      res.status(200).json(lastSessions); // Restituire l'array di sessioni come JSON
    } catch (error) {
      res.status(500).send("Errore nella ricerca dell'ultima sessione del veicolo.");
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
    // Controlla se dateFrom e dateTo sono forniti
    if (!dateFrom || !dateTo) {
      return res.status(400).send('Date non fornite.');
    }

    // Crea un oggetto Date dalla stringa fornita
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    // Controlla se la data è valida
    if (isNaN(dateFrom_new.getTime()) || isNaN(dateTo_new.getTime())) {
      return res.status(400).send('Formato della data non valido.');
    }
    if (dateFrom_new.getTime() >= dateTo_new.getTime()) {
      // Restituisci un errore se la condizione è vera
      return res
        .status(400)
        .send(
          'La data iniziale deve essere indietro di almeno 1 giorno dalla finale',
        );
    }
    const data = await this.sessionService.getAllSessionByVeIdRanged(
      params.id,
      dateFrom_new,
      dateTo_new,
    );
    if (data.length > 0) {
      res.status(200).send(data);
    } else res.status(200).send(`No Session per id: ${params.id}`);
  }

  // @Get("lastSessions/all")
  // async getVehiclesLastSession(@Res() res) {
  //   try {
  //     const sessions = await this.sessionService.getAllVehiclesLastSessions();
  //     return res.status(200).send(sessions);
  //   } catch (error) {
  //     return res.status(500).send("Errore nel recupero delle ultime sessioni dei veicoli.");
  //   }
  // }
  

  // /**
  //  * API che restituisce il controllo del tipo di guasto di un veicolo nel caso ci sia
  //  * @param res
  //  * @param params id del veicolo da controllare
  //  * @param body
  //  */
  // @Post("checkVehicle/:id")
  // async checkVehicle(@Res() res: Response, @Param() params: any, @Body() body: any){
  //   let guasti = [];
  //   const veichleId = params.id;
  //   //check GPS guasto
  //   this.checkSessionGPS()
  // }

  /**
   * Controllo sessioni registrate per ogni veicolo per funzionamento effettivo GPS, lat e log deve differire e la distanza deve essere variabile
   * @param res
   * @param body Data inizio e data fine ricerca
   * @returns
   */
  @Post('checkgps/all')
  async checkSessionGPSAll(@Res() res: Response, @Body() body: any) {
    const dateFrom = body.dateFrom;
    const dateTo = body.dateTo;
    // Controlla se dateFrom e dateTo sono forniti
    if (!dateFrom || !dateTo) {
      return res.status(400).send('Date non fornite.');
    }

    // Crea un oggetto Date dalla stringa fornita
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    // Controlla se la data è valida
    if (isNaN(dateFrom_new.getTime()) || isNaN(dateTo_new.getTime())) {
      return res.status(400).send('Formato della data non valido.');
    }
    if (dateFrom_new.getTime() >= dateTo_new.getTime()) {
      // Restituisci un errore se la condizione è vera
      return res
        .status(400)
        .send(
          'La data iniziale deve essere indietro di almeno 1 giorno dalla finale',
        );
    }
    const vehicles = await this.vehicleService.getVehiclesByReader();
    for (const vehicle of vehicles) {
      const datas = await this.sessionService.getAllSessionByVeIdRanged(
        vehicle.veId,
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
          console.log(`Anomalia nel GPS veicolo: ${vehicle.veId}`);
        }
      }
    }
    res.status(200).send({ message: 'OK' });
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
    // Controlla se dateFrom e dateTo sono forniti
    if (!dateFrom || !dateTo) {
      return res.status(400).send('Date non fornite.');
    }

    // Crea un oggetto Date dalla stringa fornita
    const dateFrom_new = new Date(dateFrom);
    const dateTo_new = new Date(dateTo);

    // Controlla se la data è valida
    if (isNaN(dateFrom_new.getTime()) || isNaN(dateTo_new.getTime())) {
      return res.status(400).send('Formato della data non valido.');
    }
    if (dateFrom_new.getTime() >= dateTo_new.getTime()) {
      // Restituisci un errore se la condizione è vera
      return res
        .status(400)
        .send(
          'La data iniziale deve essere indietro di almeno 1 giorno dalla finale',
        );
    }
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
        res.status(200).send({
          message: 'Anomalia nel GPS',
          distance: distanceMap,
          coordinates: coordinates,
        });
      } else {
        res.status(200).send('Il GPS non presenta anomalie');
      }
    } else if (datas.length === 1) {
      res
        .status(200)
        .send(
          `Soltanto 1 sessione per il controllo, selezionare un'altra data`,
        );
    } else res.status(200).send(`No Session per id: ${params.id}`);
  }



  @Get('tagcomparison/:id')
  async getTagComparison(@Res() res: Response, @Param() params: any) {
    const dayInMilliseconds = 1000 * 60 * 60 * 24;
    try {
      const veihcleId = params.id;
      //Ottieni ultima sessione
      const last_session =
        await this.sessionService.getLastValidSession(veihcleId);

      //controlla se la sessione è stata trovata
      if (!last_session) {
        console.log('sessione non trovata.');
        return null;
      }

      //calcolo della differenza tra il tempo di inizio e di fine del periodo
      const periodToMills = last_session.period_to.getTime();
      const periodFromMills = last_session.period_from.getTime();
      console.log('period to mills: ', periodToMills);
      console.log('period from mills: ', periodFromMills);

      const minutesDiff = (periodToMills - periodFromMills) / 1000 / 60; //calculate diff in minutes

      console.log('period minutes diff: ', minutesDiff);

      //controllo durata
      if (minutesDiff < 2) {
        console.log('minutes<2');
        return null;
      } else {
        console.log('minutes>2');
      }

      //Ottieni ultimo tag
      const last_tag = await this.tagService.getLastTagHistoryByVeId(params.id);

      //Controllo esistenza dell'ultima sessione o tag
      if (!last_session || !last_tag) {
        return res
          .status(400)
          .send('Ultima sessione o ultimo tag non trovati.');
      }

      //Calcolo differenza di giorni
      const dayDiff =
        (new Date(last_session.period_to).setHours(0, 0, 0, 0) -
          new Date(last_tag.timestamp).setHours(0, 0, 0, 0)) /
        dayInMilliseconds;
      console.log(`day diff: ${dayDiff}`);
      console.log('tag id: ', last_tag.id);
      //Mostra risultato
      if (dayDiff > 0) {
        res
          .status(200)
          .send('Il tag è stato letto prima della fine della sessione');
      } else if (dayDiff == 0) {
        res
          .status(200)
          .send(
            'Il tag è stato letto lo stesso giorno della fine della sessione',
          );
      } else {
        res
          .status(400)
          .send("Il tag è stato letto prima della fine dell'ultima sessione.");
      }
    } catch (error) {
      console.error('Errore nella richiesta al db:', error);
      res.status(500).send('Errore durante la richiesta al db');
    }
  }

  /**
   * Ritorna se almeno un tag è stato letto in un determinato arco di tempo
   * @param period_from data di inizio ricerca
   * @param period_to data di fine ricerca
   * @param params
   * @param res
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
    console.log(lastTag);
    if (!sessions) {
      res
        .status(400)
        .send(
          `Nel range di tempo ${period_from} - ${period_to} non è stata è stata effettuata alcuna sessione.`,
        );
    }
    if (!lastTag) {
      res
        .status(400)
        .send(
          `Nel range di tempo ${period_from} - ${period_to} non è stato letto alcun tag.`,
        );
    }
    if (sessions && lastTag) {
      res
        .status(200)
        .send(
          `Nel range di tempo ${period_from} - ${period_to} l'ultimo tag è stato ${JSON.stringify(lastTag)} ed è stato letto nella sessione ${JSON.stringify(sessions)}`,
        );
    }
  }

  /**
   * Ritorna tutti i veicoli dove la data dell'ultima sessione non corrisponde all ultimo tag registrato
   * @param res
   */
  @Get('lastevent/all')
  async lastEventComparisonAll(@Res() res: Response) {
    try {
      const outputErrors = [];
      const vehicles = await this.vehicleService.getVehiclesByReader();
      for (const vehicle of vehicles) {
        const lastSession = await this.sessionService.getLastSession(
          vehicle.veId,
        );
        if (lastSession) {
          const lastVehicleEvent = vehicle.lastEvent;
          const sessionEnd = lastSession.period_to;
          if (
            new Date(lastVehicleEvent).getTime() !=
            new Date(sessionEnd).getTime()
          ) {
            outputErrors.push(vehicle);
            // console.log({
            //   message:
            //     "L'ultimo evento del veicolo NON corrisponde con la fine della sua ultima sessione.",
            //   lastVehicleEvent,
            //   sessionEnd,
            // });
          }
        }
      }
      if (outputErrors.length > 0) {
        res.status(200).send({
          message:
            "Veicoli dove l'ultima sessione non corrisponde all'ultimo evento registrato",
          outputErrors,
        });
      } else {
        res.status(200).send({
          message: 'Nessun veicolo presenta incongruenze',
        });
      }
    } catch (error) {
      console.error('Error getting last event: ', error);
      res.status(500).send('Errore durante la richiesta al db');
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
          res.status(200).send({
            message:
              "L'ultimo evento del veicolo corrisponde con la fine della sua ultima sessione.",
          });
        } else {
          res.status(200).send({
            message:
              "L'ultimo evento del veicolo NON corrisponde con la fine della sua ultima sessione.",
            lastVehicleEvent,
            sessionEnd,
          });
        }
      } else {
        res.status(404).send('Veicolo non trovato id:' + params.id);
      }
    } catch (error) {
      console.error('Error getting last event: ', error);
      res.status(500).send('Errore durante la richiesta al db');
    }
  }

  @Post('update/:id')
  async getHistoryList(
    @Res() res: Response,
    @Param() params: any,
    @Body() body: any,
  ) {
    try {
      const dateFrom = body.dateFrom;
      const dateTo = body.dateTo;
      // Controlla se dateFrom e dateTo sono forniti
      if (!dateFrom || !dateTo) {
        return res.status(400).send('Date non fornite.');
      }

      // Crea un oggetto Date dalla stringa fornita
      const dateFrom_new = new Date(dateFrom);
      const dateTo_new = new Date(dateTo);

      // Controlla se la data è valida
      if (isNaN(dateFrom_new.getTime()) || isNaN(dateTo_new.getTime())) {
        return res.status(400).send('Formato della data non valido.');
      }
      if (dateFrom_new.getTime() >= dateTo_new.getTime()) {
        // Restituisci un errore se la condizione è vera
        return res
          .status(400)
          .send(
            'La data iniziale deve essere indietro di almeno 1 giorno dalla finale',
          );
      }
      const data = await this.sessionService.getSessionist(
        params.id,
        dateFrom_new.toISOString(),
        dateTo_new.toISOString(),
      );

      if (data.length > 0) {
        // let resultMessage: string = `Aggiornata history del veicolo: ${params.id}, dal giorno ${dateFrom} al giorno ${dateTo}.\n\n`;
        // for (const item of data) {
        //   resultMessage += `History inserito del: ${item.timestamp}\n `;
        // }
        // res.status(200).send(resultMessage);
        res.status(200).send(data);
      } else if (data === false) {
        res.status(200).send(`No History per veicolo con id: ${params.id}\n`);
      } else {
        res.status(200).send('Nessun aggiornamento');
      }
    } catch (error) {
      console.error('Errore nella richiesta al db:', error);
      res.status(500).send('Errore durante la richiesta al db');
    }
  }
}
