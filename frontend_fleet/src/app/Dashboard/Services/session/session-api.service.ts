import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable} from 'rxjs';
import { Session } from '../../../Models/Session';
import { CommonService } from '../../../Common-services/common service/common.service';

@Injectable({
  providedIn: 'root'
})
export class SessionApiService {
  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) { }

  /**
   * Prende i dati di tutte le sessioni dall'api gestita nel backend
   * @returns observable get http
   */
  public getAllSessions(): Observable<Session[]>{
    return this.http.get<Session[]>(`${this.commonService.url}/sessions`);
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
    return this.getAllSessionsRanged(this.commonService.dateFrom, this.commonService.dateTo); //da cambiare in data di ieri e attuale
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
