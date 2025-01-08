import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonService } from '../common service/common.service';
import { Vehicle } from '../../Models/Vehicle';
import { CookiesService } from '../cookies service/cookies.service';

@Injectable({
  providedIn: 'root'
})
export class CheckErrorsService {
  /**
   * Trasporta i dati dei veicoli nel caso uno spicchio venga deselezionato
   */
  private _fillTable$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  constructor(
    private http: HttpClient,
    private cookieService: CookiesService,
    private commonService: CommonService
  ) { }

  /**
 * Controlla se è presente un errore di GPS nella sessione, nel range temporale , del veicolo preso in input
 * @param vehicle
 * @returns l'anomalia se viene riscontrata, altrimenti "null"
 */
  checkGpsError(vehicle: Vehicle): string | null {
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;

    const anomalies = vehicle.anomalies ?? [];

    const foundAnomaly = anomalies.find(anomalyObj => {
      const anomaliesDate = new Date(anomalyObj.date);
      return anomaliesDate >= dateFrom && anomaliesDate <= dateTo && anomalyObj.gps?.includes("TOTALE") || anomalyObj.gps?.includes("totale");
    });
    return foundAnomaly ? foundAnomaly.session : null;
  }


  checkGPSWarning(vehicle: Vehicle): string | null{
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;

    const anomalies = vehicle.anomalies;
    const foundAnomaly = anomalies.find(anomalyObj => {
      const anomalyDate = new Date(anomalyObj.date);
      return anomalyDate>=dateFrom && anomalyDate<=dateTo && !anomalyObj.gps?.includes("TOTALE") || !anomalyObj.gps?.includes("totale");
    });

    return foundAnomaly ? foundAnomaly.antenna : null;
  }



  /**
   * Controlla se è presente un errore di antenna del veicolo preso in input
   * @param vehicle veicolo da controllare
   * @returns l'anomalia se viene riscontrata, altrimenti "null"
   */
  checkAntennaError(vehicle: Vehicle): string | null {
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;

    const anomalies = vehicle.anomalies;
    const foundAnomaly = anomalies.find(anomalyObj => {
      const anomalyDate = new Date(anomalyObj.date);
      return anomalyDate>=dateFrom && anomalyDate<=dateTo;
    });

    return foundAnomaly ? foundAnomaly.antenna : null;
  }

  /**
   * Controlla se è presente un anomalia di sessione del veicolo preso in input nell'arco di tempo definito nel common service
   * @param vehicle veicolo da controllare
   * @returns tipo di anomalia di sessione se trovata
   * @returns null se non viene trovata un'anomalia
   */
  checkSessionError(vehicle: Vehicle): string | null {
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;

    const anomalies = vehicle.anomalies;

    //ricerca anomalia nell'arco di tempo richiesto
    const foundAnomaly = anomalies.find(anomaliesObj => {
      const anomaliesDate = new Date(anomaliesObj.date); // Data delle anomalie
      return anomaliesDate >= dateFrom && anomaliesDate <= dateTo;
    });

    return foundAnomaly ? foundAnomaly.session : null;
  }


  /**
   * Calcola da quanti giorni le sessioni di un veicolo sono in errore
   * @param vehicle veicolo da cui prendere l'ultimo evento
   * @returns differenza in giorni: oggi - lastevent
   */
  public calculateSessionErrorDays(vehicle: Vehicle): number {
    // const todayDate = new Date(); //giorni di oggi

    // //verifica che lastEvent non sia null
    // if (!vehicle.lastEvent) {
    //   return -1;
    // }

    // const vehicleLastEvent = new Date(vehicle.lastEvent); //ultimo evento del veicolo

    // const differenceInMillis = todayDate.getTime() - vehicleLastEvent.getTime(); //differenza in millisecondi
    // const differenceInDays = Math.floor(differenceInMillis / (1000 * 60 * 60 * 24)); //conversione differenza in giorni

    // return differenceInDays;
    return 1;
  }

  /**
   * Controlla i gps dei veicoli passati come parametro
   * @param vehicles veicoli da controllare
   * @returns array formato da: [workingVehicles, warningVehicles, errorVehicles]
   */
  public checkVehiclesGpsErrors(vehicles: Vehicle[]): [Vehicle[], Vehicle[], Vehicle[]] {
    const workingVehicles: Vehicle[] = [];
    const warningVehicles: Vehicle[] = [];
    const errorVehicles: Vehicle[] = [];

    vehicles.forEach(vehicle => {
      //controllo errore gps
      if (this.checkGpsError(vehicle)) {
        errorVehicles.push(vehicle);
      }
      //controllo warning gps
      else if (this.checkGPSWarning(vehicle)) {
        warningVehicles.push(vehicle);
      }
      //veicolo in funzionamento corretto
      else {
        workingVehicles.push(vehicle);
      }
    });

    return [workingVehicles, warningVehicles, errorVehicles];
  }



  /**
   * Controlla le antenne dei veicoli passati come parametro
   * @param vehicles veicoli da controllare
   * @returns array formato da: [workingVehicles, errorVehicles]
   */
  public checkVehiclesAntennaErrors(vehicles: Vehicle[]){
    const workingVehicles: Vehicle[] = [];
    const errorVehicles: Vehicle[] = [];

    vehicles.map(vehicle => {
      if(vehicle.vehicle.isRFIDReader){
        const antennaCheck = this.checkAntennaError(vehicle);
        if(antennaCheck){
          errorVehicles.push(vehicle);
        }else{
          workingVehicles.push(vehicle);
        }
      }
    });
    return [workingVehicles, errorVehicles];
  }

  /**
   * Controlla l'anomalia di sessione dei veicoli passati come parametro
   * @param vehicles veicoli da controllare
   * @returns array formato da: [workingVehicles, errorVehicles]
   */
  checkVehiclesSessionErrors(vehicles: Vehicle[]){
    const workingVehicles: Vehicle[] = [];
    const errorVehicles: Vehicle[] = [];

    vehicles.map(vehicle => {
      const sessionCheck = this.checkSessionError(vehicle);
      if(sessionCheck){
        errorVehicles.push(vehicle);
      }else{
        workingVehicles.push(vehicle);
      }
    });
    return [workingVehicles, errorVehicles];
  }

  /**
   * Controlla gli errori di tutti i veicoli con sessioni in un determinato arco di tempo
   * @param dateFrom data di inizio ricerca
   * @param dateTo data di fine ricerca
   * @returns observable http
   */
  public checkErrorsAllRanged(dateFrom: Date, dateTo: Date): Observable<any> {
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      dateFrom: dateFrom,
      dateTo: dateTo
    };

    return this.http.post(
      `${this.commonService.url}/anomaly`,
      body,
      { headers }
    );
  }


  /**
 * Controlla gli errori di tutti i veicoli con sessioni nella giornata di oggi
 * @returns observable http
  */
  public checkErrorsAllToday(): Observable<any>{
    return this.checkErrorsAllRanged(new Date(), new Date());
  }


  public get fillTable$(): BehaviorSubject<any[]> {
    return this._fillTable$;
  }
}
