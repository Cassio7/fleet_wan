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

    if(vehicle.sessions?.length > 0){
      for(const s of vehicle.sessions){
        const sessionDate = new Date(s.date);
        if(sessionDate >= dateFrom && sessionDate <= dateTo){
          gpsAnomaly = s.anomalies?.find((anomaly: any) => 'GPS' in anomaly);
        }
      }
    }

    if (gpsAnomaly) {
      console.log(gpsAnomaly);
      console.log(vehicle);
      return gpsAnomaly.GPS || 'Errore GPS';
    }

    return null;
  }

  /**
   * Controlla se è presente un errore di antenna nella sessione di oggi del veicolo preso in input
   * @param vehicle
   * @returns se viene riscontrata l'anomalia di antenna in una sessione nel range di tempo, altrimenti "null"
   */
  checkAntennaError(vehicle: { anomalySessions?: { date: string; anomalies?: { antenna?: string }[] }[] }): string | boolean {
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;

    // Verifica che il veicolo abbia sessioni di anomalie
    if (vehicle.anomalySessions?.length) {
      for (const session of vehicle.anomalySessions) {
        const sessionDate = new Date(session.date);

        // Se la sessione è nel range di date, cerca l'anomalia "antenna"
        if (sessionDate >= dateFrom && sessionDate <= dateTo) {
          const antennaAnomaly = session.anomalies?.find(anomaly => anomaly.antenna);

          if (antennaAnomaly) {
            return antennaAnomaly.antenna || 'Errore antenna';
          }
        }
      }
    }

    return false;
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

    if(vehicle.sessions?.length > 0){
      for (const s of vehicle.sessions) {
        const sessionDate = new Date(s.date);
        if (sessionDate >= dateFrom && sessionDate <= dateTo) {
          sessionAnomaly = s.anomalies?.find((anomaly: any) => 'sessionEnd' in anomaly);
        }
      }
    }

    if(!vehicle.lastValidSession.period_from){
      return "Nessuna sessione trovata"
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
