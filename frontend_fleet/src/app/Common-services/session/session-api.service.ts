import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable} from 'rxjs';
import { Session } from '../../Models/Session';
import { CookieService } from 'ngx-cookie-service';
import { VehicleAnomalies } from '../check-errors/check-errors.service';
import { serverUrl } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class SessionApiService {
  private readonly _loadAnomalySessionDays$ = new BehaviorSubject<Date[]>([]);

  private url: string = "sessions";

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
  ) { }

  /**
   * Permette di prendere i dati di tutte le sessioni dall'api gestita nel backend
   * @returns observable get http
   */
  public getAllSessions(): Observable<Session[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<Session[]>(`${serverUrl}/${this.url}`, {headers});
  }

  /**
   * Permette di prendere le sessioni di un veicolo tramite un veId
   * @param veId veId del veicolo di cui prendere le sessioni
   * @param dateFrom data di inizio ricerca
   * @param dateTo data di fine ricerca
   * @returns array di sessioni effettuate dal mezzo a cui appartiene il veId nel range di tempo specificato
   */
  public getSessionsByVeIdRanged(veId: number, dateFrom: Date, dateTo: Date): Observable<Session[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    const dateFromFormat = new Date(dateFrom)
    const body={
      veId: veId,
      dateFrom: dateFromFormat.toString(),
      dateTo: dateTo.toString()
    }
    return this.http.post<Session[]>(`${serverUrl}/${this.url}/veId/ranged?filter=true`, body, {headers});
  }

  /**
   * Permette di prendere le anomalie dell'ultimo andamento di ogni veicolo
   * @returns observable get http
   */
  public getAllLastSessionAnomalies(): Observable<any>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${serverUrl}/anomaly/last`, {headers});
  }

  /**
   * Permette di prendere i dati delle anomalie nelle giornate in base ad un range
   * @param veId veId del veicolo
   * @param dateFrom data di inizio
   * @param dateTo data di fine
   * @returns observable<VehicleAnomalies> http post
   */
  public getDaysAnomaliesRangedByVeid(veId: number, dateFrom: Date, dateTo: Date): Observable<VehicleAnomalies>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      veId: veId,
      dateFrom: dateFrom.toString(),
      dateTo: dateTo.toString()
    }

    return this.http.post<VehicleAnomalies>(`${serverUrl}/anomaly/veId/ranged`, body, {headers});
  }

  /**
   * Prende i dati di tutte le sessioni di un veicolo che sono avvenute nel range di tempo preso come parametri
   * @param start_date data di inizio del periodo
   * @param end_date data di fine del periodo
   * @returns observable post http
   */
  public getAllSessionsRanged(start_date: Date, end_date: Date) {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    const dateFrom = start_date.toString();
    const dateTo = end_date.toString();

    // Parametri nel corpo della richiesta
    const body = {
      dateFrom: dateFrom,
      dateTo: dateTo
    };

    // Send the POST request
    return this.http.post<Session[]>(`${serverUrl}/session/ranged/all`, body, {headers})
      .pipe(
        catchError(error => {
          console.error('Errore durante la richiesta:', error);
          throw error;
        })
      );
  }

  updateSessionAnomalies(veId: number, start_date: Date, end_date: Date): Observable<{message: string}>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const dateFrom = start_date.toString();
    const dateTo = end_date.toString();

    const body = {
      veId: veId,
      dateFrom: dateFrom,
      dateTo: dateTo
    }

    return this.http.post<{message: string}>(`${serverUrl}/refresher`, body, {headers});
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
    return this.http.get<Session[]>(`${serverUrl}/session/lastsessions/all`);
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
    return this.http.get<any[]>(`${serverUrl}/session/lastvalidnohistory/all`);
  }

  public get loadAnomalySessionDays$(): BehaviorSubject<Date[]> {
    return this._loadAnomalySessionDays$;
  }
}
