import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, Subject} from 'rxjs';
import { Session } from '../../Models/Session';
import { CommonService } from '../common service/common.service';
import { VehicleData } from '../../Models/VehicleData';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { CookiesService } from '../cookies service/cookies.service';
import { VehicleAnomalies } from '../../Models/VehicleAnomalies';

@Injectable({
  providedIn: 'root'
})
export class SessionApiService {
  private readonly _loadAnomalySessionDays$ = new BehaviorSubject<Date[]>([]);

  constructor(
    private http: HttpClient,
    private cookieService: CookiesService,
    private commonService: CommonService
  ) { }

  /**
   * Permette di prendere i dati di tutte le sessioni dall'api gestita nel backend
   * @returns observable get http
   */
  public getAllSessions(): Observable<Session[]>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<Session[]>(`${this.commonService.url}/sessions`, {headers});
  }

  /**
   * Permette di prendere le sessioni di un veicolo tramite un veId
   * @param veId veId del veicolo di cui prendere le sessioni
   * @param dateFrom data di inizio ricerca
   * @param dateTo data di fine ricerca
   * @returns array di sessioni effettuate dal mezzo a cui appartiene il veId nel range di tempo specificato
   */
  public getSessionsByVeIdRanged(veId: number, dateFrom: Date, dateTo: Date): Observable<Session[]>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    const body={
      veId: veId,
      dateFrom: dateFrom,
      dateTo: dateTo
    }
    return this.http.post<Session[]>(`${this.commonService.url}/sessions/veId/ranged`, body, {headers});
  }

  /**
   * Permette di prendere le anomalie dell'ultimo andamento di ogni veicolo
   * @returns observable get http
   */
  public getAllLastSessionAnomalies(): Observable<any>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${this.commonService.url}/anomaly/last`, {headers});
  }

  /**
   * Permette di prendere i dati delle anomalie nelle giornate in base ad un range
   * @param veId veId del veicolo
   * @param dateFrom data di inizio
   * @param dateTo data di fine
   * @returns observable<VehicleAnomalies> http post
   */
  public getDaysAnomaliesRangedByVeid(veId: number, dateFrom: Date, dateTo: Date): Observable<VehicleAnomalies>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      veId: veId,
      dateFrom: this.formatDate(dateFrom),
      dateTo: this.formatDate(dateTo)
    }

    console.log("request body: ", body);

    return this.http.post<VehicleAnomalies>(`${this.commonService.url}/anomaly/veId/ranged`, body, {headers});
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Prende i dati di tutte le sessioni di un veicolo che sono avvenute nel range di tempo preso come parametri
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

  public get loadAnomalySessionDays$(): BehaviorSubject<Date[]> {
    return this._loadAnomalySessionDays$;
  }
}
