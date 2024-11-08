import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { Session } from '../../models/Session';
import { VehiclesApiService } from '../vehicles service/vehicles-api.service';

@Injectable({
  providedIn: 'root'
})
export class SessionApiService {
  private readonly destroy$: Subject<void> = new Subject<void>();
  constructor(
    private http: HttpClient,
    private vehicleApiService: VehiclesApiService
  ) { }


  public getAllSessions(): Observable<Session[]>{
    return this.http.get<Session[]>("http://10.1.0.102:3001/sessions");
  }

  public getAllSessionsRangedByVeid(start_date: Date, end_date: Date, plate: string){

  }
}
