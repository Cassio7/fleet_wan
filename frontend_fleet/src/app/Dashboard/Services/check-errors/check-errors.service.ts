import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonService } from '../common service/common.service';

@Injectable({
  providedIn: 'root'
})
export class CheckErrorsService {
  private _fillTable$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) { }

    /**
   * Controlla se è presente un errore di GPS nella sessione di oggi del veicolo preso in input
   * @param vehicle
   * @returns
   */
  checkGpsError(vehicle: any): string | null {
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;
    let gpsAnomaly: any;

    for(const s of vehicle.sessions){
      const sessionDate = new Date(s.date);
      if(sessionDate >= dateFrom && sessionDate <= dateTo){
        gpsAnomaly = s.anomalies?.find((anomaly: any) => 'GPS' in anomaly);
      }
    }

    if (gpsAnomaly) {
      return gpsAnomaly.GPS || 'Errore GPS';
    }

    return null;
  }

  /**
   * Controlla se è presente un errore di antenna nella sessione di oggi del veicolo preso in input
   * @param vehicle
   * @returns
   */
  checkAntennaError(vehicle: any): string | null {
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;

    let antennaAnomaly: any;

    for (const s of vehicle.sessions) {
      const sessionDate = new Date(s.date);
      if (sessionDate >= dateFrom && sessionDate <= dateTo) {
        antennaAnomaly = s.anomalies?.find((anomaly: any) => 'antenna' in anomaly);
      }
    }


    if (antennaAnomaly) {
      return antennaAnomaly.antenna || 'Errore antenna';
    }

    return null;
  }

  /**
   * Controlla se è presente un anomalia di sessione nella sessione di oggi del veicolo preso in input
   * @param vehicle veicolo da controllare
   * @returns
   */
  checkSessionError(vehicle: any): string | null {
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;

    let sessionAnomaly: any;

    for (const s of vehicle.sessions) {
      const sessionDate = new Date(s.date);
      if (sessionDate >= dateFrom && sessionDate <= dateTo) {
        sessionAnomaly = s.anomalies?.find((anomaly: any) => 'sessionEnd' in anomaly);
      }
    }

    if (sessionAnomaly) {
      return sessionAnomaly.sessionEnd || 'Errore sessione';
    }

    return null;
  }

  /**
 * Controlla gli errori di tutti i veicoli con sessioni in un determinato arco di tempo
 * @param dateFrom data di inizio ricerca
 * @param dateTo data di fine ricerca
 * @returns observable http
 */
  public checkErrorsAllRanged(dateFrom: Date, dateTo: Date): Observable<any>{
    const body = {
      dateFrom: dateFrom,
      dateTo: dateTo
    }
    return this.http.post(`http://10.1.0.102:3001/session/checkerrors/all`, body);
  }

  /**
 * Controlla gli errori di tutti i veicoli con sessioni nella giornata di oggi
 * @param dateFrom data di inizio ricerca
 * @param dateTo data di fine ricerca
 * @returns observable http
*/
  public checkErrorsAllToday(): Observable<any>{
    //*DA CAMBIARE A DATA ATTUALE*
    const body = {
      dateFrom: this.commonService.dateFrom,
      dateTo: this.commonService.dateTo
    }
    return this.http.post(`http://10.1.0.102:3001/session/checkerrors/all`, body);
  }


  public get fillTable$(): BehaviorSubject<any[]> {
    return this._fillTable$;
  }
}
