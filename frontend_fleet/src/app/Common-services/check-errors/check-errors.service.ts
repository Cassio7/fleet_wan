import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonService } from '../common service/common.service';
import { Vehicle } from '../../Models/Vehicle';
import { CookiesService } from '../cookies service/cookies.service';
import { VehicleData} from '../../Models/VehicleData';
import { Anomaly } from '../../Models/Anomaly';

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
  checkGpsError(vehicleData: VehicleData): string | null {
    const gpsAnomaly: string | undefined | null = this.checkVehicleAnomaly(vehicleData)?.gps;

    if (gpsAnomaly && (gpsAnomaly.includes("TOTALE") || gpsAnomaly.includes("totale") || gpsAnomaly.includes("Totale"))) {
      return gpsAnomaly;
    }

    return null;
  }

  /**
   * Controlla se è presente un warning di GPS nella sessione, nel range temporale , del veicolo preso in input
   * @param vehicle
   * @returns l'anomalia se viene riscontrata, altrimenti "null"
   */
  checkGPSWarning(vehicleData: VehicleData): string | null {
    const gpsAnomaly: string | undefined | null = this.checkVehicleAnomaly(vehicleData)?.gps;

    if (gpsAnomaly && !(gpsAnomaly.includes("TOTALE") || gpsAnomaly.includes("totale") || gpsAnomaly.includes("Totale"))) {
      return gpsAnomaly;
    }

    return null;
  }


  /**
   * Controlla se è presente un errore di antenna del veicolo preso in input
   * @param vehicle veicolo da controllare
   * @returns l'anomalia se viene riscontrata, altrimenti "null"
   */
  checkAntennaError(vehicleData: VehicleData): string | null {
    return this.checkVehicleAnomaly(vehicleData)?.antenna || null;
  }

  /**
   * Controlla se è presente un anomalia di sessione del veicolo preso in input nell'arco di tempo definito nel common service
   * @param vehicle veicolo da controllare
   * @returns tipo di anomalia di sessione se trovata
   * @returns null se non viene trovata un'anomalia
   */
  checkSessionError(vehicleData: VehicleData): string | null {
    return this.checkVehicleAnomaly(vehicleData)?.session || null;
  }

  checkVehicleAnomaly(vehicleData: VehicleData): Anomaly | null{
    const dateFrom = new Date(this.commonService.dateFrom);
    const dateTo = new Date(this.commonService.dateTo);

    const anomalies: Anomaly[] = vehicleData.anomalies;

    //controllo sulla presenza anomalie
    if (!anomalies) {
      return null;  //restituisci null se anomalies è null o undefined
    }

    //ricerca anomalia nell'arco di tempo richiesto
    const foundAnomaly: any = Object.values(anomalies).find((anomaliesObj: Anomaly) => {
      const anomalyDate = new Date(anomaliesObj.date); // Data delle anomalie
      anomalyDate.setHours(0,0,0,0);
      return anomalyDate >= dateFrom && anomalyDate <= dateTo;
    });

    return foundAnomaly ? foundAnomaly : null;
  }



  /**
   * Calcola da quanti giorni le sessioni di un veicolo sono in errore
   * @param vehicle veicolo da cui prendere l'ultimo evento
   * @returns differenza in giorni: oggi - lastevent
   */
  public calculateSessionErrorDays(vehicle: VehicleData): number {
    // const todayDate = new Date(); //giorni di oggi

    // //verifica che lastEvent non sia null
    // if (!vehicle.lastEvent) {
    //   return -1;
    // }

    // const vehicleLastEvent = new Date(vehicle.lastEvent); //ultimo evento del veicolo

    // const differenceInMillis: any[] = todayDate.getTime() - vehicleLastEvent.getTime(); //differenza in millisecondi
    // const differenceInDays: any[] = Math.floor(differenceInMillis / (1000 * 60 * 60 * 24)); //conversione differenza in giorni

    // return differenceInDays;
    return 1;
  }

  /**
   * Controlla i gps dei veicoli passati come parametro
   * @param vehicles veicoli da controllare
   * @returns array formato da: [workingVehicles, warningVehicles, errorVehicles]
   */
  public checkVehiclesGpsErrors(vehiclesData: VehicleData[]): [VehicleData[], VehicleData[], VehicleData[]] {
    const workingVehicles: VehicleData[] = [];
    const warningVehicles: VehicleData[] = [];
    const errorVehicles: VehicleData[] = [];

    vehiclesData.forEach(vehicleData => {
      //controllo errore gps
      if (this.checkGpsError(vehicleData)) {
        errorVehicles.push(vehicleData);
      }
      //controllo warning gps
      else if (this.checkGPSWarning(vehicleData)) {
        warningVehicles.push(vehicleData);
      }
      //veicolo in funzionamento corretto
      else {
        workingVehicles.push(vehicleData);
      }
    });

    return [workingVehicles, warningVehicles, errorVehicles];
  }



  /**
   * Controlla le antenne dei veicoli passati come parametro
   * @param vehicles veicoli da controllare
   * @returns array formato da: [workingVehicles, errorVehicles]
   */
  public checkVehiclesAntennaErrors(vehiclesData: VehicleData[]){
    const workingVehicles: VehicleData[] = [];
    const errorVehicles: VehicleData[] = [];

    vehiclesData.map(vehicleData => {
      if(vehicleData.vehicle.isRFIDReader){
        const antennaCheck = this.checkAntennaError(vehicleData);
        if(antennaCheck){
          errorVehicles.push(vehicleData);
        }else{
          workingVehicles.push(vehicleData);
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
  checkVehiclesSessionErrors(vehiclesData: VehicleData[]){
    const workingVehicles: VehicleData[] = [];
    const errorVehicles: VehicleData[] = [];

    vehiclesData.map(vehicleData => {
      const sessionCheck = this.checkSessionError(vehicleData);
      if(sessionCheck){
        errorVehicles.push(vehicleData);
      }else{
        workingVehicles.push(vehicleData);
      }
    });
    return [workingVehicles, errorVehicles];
  }

  getVehicleSessionAnomalyDate(vehicleData: VehicleData){
      const dateFrom = new Date(this.commonService.dateFrom);
      const dateTo = new Date(this.commonService.dateTo);

      const anomalies: Anomaly[] = vehicleData.anomalies;

      //controllo sulla presenza anomalie
      if (!anomalies) {
        return null;
      }

      const foundAnomaly: any = Object.values(anomalies).find((anomaliesObj: Anomaly) => {
        const anomalyDate = new Date(anomaliesObj.date);
        anomalyDate.setHours(0,0,0,0);
        return anomalyDate >= dateFrom && anomalyDate <= dateTo;
      });

      return foundAnomaly ? foundAnomaly.date : null;
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
