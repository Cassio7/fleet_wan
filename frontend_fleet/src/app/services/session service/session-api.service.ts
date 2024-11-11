import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { Session } from '../../models/Session';
import { VehiclesApiService } from '../vehicles service/vehicles-api.service';

@Injectable({
  providedIn: 'root'
})
export class SessionApiService {
  private readonly destroy$: Subject<void> = new Subject<void>();
  constructor(
    private http: HttpClient
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
   * Prende l'ultima sessione di ciascun veicolo
   * @returns
   */
  public getAllVehiclesLastSessions(): Observable<Session[]>{
    return this.http.get<Session[]>(`http://10.1.0.102:3001/session/lastsessions/all`);
  }


}
