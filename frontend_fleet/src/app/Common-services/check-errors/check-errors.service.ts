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

  /**
   * Controlla se il veicolo ha giornate con anomalie nell'arco di tempo specificato nel commonService
   * @param vehicleData dati del veicolo da controllare
   * @returns oggetto anomalia se presente
   * @returns null se non sono presenti anomalie
   */
  checkVehicleAnomaly(vehicleData: VehicleData): Anomaly | null{
    const dateFrom = this.commonService.dateFrom
    const dateTo = this.commonService.dateTo;

    const anomalies: Anomaly[] = vehicleData.anomalies;
    //controllo sulla presenza anomalie
    if (!anomalies) {
      return null;
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
  public calculateSessionErrorDays(vehicleData: VehicleData): number | null {
    const anomaly: Anomaly | null = this.checkVehicleAnomaly(vehicleData);

    if (anomaly && anomaly.date) {
      const anomalyDate: number = new Date(anomaly.date).setHours(0, 0, 0, 0);

      const today = new Date().setHours(0,0,0,0);

      const diffInMilliseconds: number = today - anomalyDate;

      const diffInDays: number = diffInMilliseconds / (1000 * 60 * 60 * 24);

      return diffInDays;
    }

    return null;
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
      if(vehicleData.vehicle?.isRFIDReader){
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

  getVehicleSessionAnomalyDate(vehicleData: VehicleData): Date | null {
    const dateFrom = new Date(this.commonService.dateFrom);
    const dateTo = new Date(this.commonService.dateTo);

    dateFrom.setHours(0, 0, 0, 0);
    dateTo.setHours(0, 0, 0, 0);

    const anomalies: Anomaly[] = vehicleData.anomalies;

    if (!anomalies || !Array.isArray(anomalies)) {
        return null;
    }

    const foundAnomaly = anomalies.find((anomaliesObj: Anomaly) => {
        const anomalyDate = new Date(anomaliesObj.date);
        anomalyDate.setHours(0, 0, 0, 0);
        return anomalyDate >= dateFrom && anomalyDate <= dateTo;
    });

    return foundAnomaly ? new Date(foundAnomaly.date) : null;
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

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const body = {
      dateFrom: formatDate(dateFrom),
      dateTo: formatDate(dateTo)
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
