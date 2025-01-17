import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, Subject} from 'rxjs';
import { Session } from '../../../Models/Session';
import { CommonService } from '../../../Common-services/common service/common.service';
import { VehicleData } from '../../../Models/VehicleData';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { CookiesService } from '../../../Common-services/cookies service/cookies.service';

@Injectable({
  providedIn: 'root'
})
export class SessionApiService {
  constructor(
    private http: HttpClient,
    private cookieService: CookiesService,
    private commonService: CommonService
  ) { }

  /**
   * Prende i dati di tutte le sessioni dall'api gestita nel backend
   * @returns observable get http
   */
  public getAllSessions(): Observable<Session[]>{
    return this.http.get<Session[]>(`${this.commonService.url}/sessions`);
  }

  public getAllLastSession(): Observable<any>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.commonService.url}/anomaly/last`, {headers});
  }

  /**
   * Prende i dati di tutte le sessioni che sono avvenute nel range di tempo preso come parametri
   * @param start_date data di inizio del periodo
   * @param end_date data di fine del periodo
   * @returns observable post http
   */
  public getAllSessionsRanged(start_date: Date, end_date: Date) {
    const dateFrom = start_date.toISOString();
    const dateTo = end_date.toISOString();

    // Parametri nel corpo della richiesta
    const body = {
      dateFrom: dateFrom,
      dateTo: dateTo
    };

    // Send the POST request
    return this.http.post<Session[]>(`${this.commonService.url}/session/ranged/all`, body)
      .pipe(
        catchError(error => {
          console.error('Errore durante la richiesta:', error);
          throw error;
        })
      );
  }

  /**
   * Prende le sessioni avvenute oggi (+ commento con modifica da apportare a prodotto completo)
   * @returns observable post http
   */
  public getTodaySessions(){
    return this.getAllSessionsRanged(new Date(), new Date()); //da cambiare in data di ieri e attuale
  }

  /**
   * Prende l'ultima sessione di ciascun veicolo
   * @returns observable get http
   */
  public getAllVehiclesLastSessions(): Observable<Session[]>{
    return this.http.get<Session[]>(`${this.commonService.url}/session/lastsessions/all`);
  }

  // /**
  //  * Prende l'ultima sessione di un veicolo
  //  * @param veId veicolo da cui prendere l'ultima sessione
  //  * @returns Observable con
  //  */
  // public getLastValidSession(veId: number){
  //   return this.http.get<Session>(``)
  // }

  /**
   * Prende l'ultima sessione valida di ogni veicolo
   * @returns observable get http
   */
  public getAllVehiclesLastValidSession(): Observable<any[]>{
    return this.http.get<any[]>(`${this.commonService.url}/session/lastvalidnohistory/all`);
  }

}
