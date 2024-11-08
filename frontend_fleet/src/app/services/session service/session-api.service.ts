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


  public getAllSessions(): Observable<Session[]>{
    return this.http.get<Session[]>("http://10.1.0.102:3001/sessions");
  }

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


}
