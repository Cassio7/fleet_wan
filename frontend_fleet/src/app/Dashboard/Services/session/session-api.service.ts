import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable} from 'rxjs';
import { Session } from '../../../Models/Session';
import { Vehicle } from '../../../Models/Vehicle';
import { CommonService } from '../common service/common.service';

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
   * @returns
   */
  public getAllSessions(): Observable<Session[]>{
    return this.http.get<Session[]>("http://10.1.0.102:3001/sessions");
  }

  /**
   * Prende i dati di tutte le sessioni che sono avvenute nel range di tempo preso come parametri
   * @param start_date data di inizio del periodo
   * @param end_date data di fine del periodo
   * @returns
   */
  public getAllSessionsRanged(start_date: Date, end_date: Date) {
    const dateFrom = start_date.toISOString();
    const dateTo = end_date.toISOString();

    console.log("Inviata la richiesta: " + dateFrom + " to: " + dateTo);

    // Parametri nel corpo della richiesta
    const body = {
      dateFrom: dateFrom,
      dateTo: dateTo
    };

    // Send the POST request
    return this.http.post<Session[]>('http://10.1.0.102:3001/session/ranged/all', body)
      .pipe(
        catchError(error => {
          console.error('Errore durante la richiesta:', error);
          throw error;
        })
      );
  }

  /**
   * Prende le sessioni avvenute oggi (+ commento con modifica da apportare a prodotto completo)
   * @returns
   */
  public getTodaySessions(){
    return this.getAllSessionsRanged(new Date('2024-10-04'), new Date('2024-10-05')); //da cambiare in data di ieri e attuale
  }

  /**
   * Prende l'ultima sessione di ciascun veicolo
   * @returns
   */
  public getAllVehiclesLastSessions(): Observable<Session[]>{
    return this.http.get<Session[]>(`${this.commonService.url}/session/lastsessions/all`);
  }

  public getLastValidSession(veId: number){
    return this.http.get<Session>(``)
  }

  public getAllVehiclesLastValidSession(): Observable<any[]>{
    return this.http.get<any[]>(`${this.commonService.url}/session/lastvalidnohistory/all`);
  }

}
