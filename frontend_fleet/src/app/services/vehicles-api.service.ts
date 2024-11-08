import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VehiclesApiService {

  constructor(
    private http: HttpClient
  ) { }


  public getAllVehicles(): Observable<any>{
    return this.http.get("http://10.1.0.102:3001/vehicles");
  }

  public getVehicleByPlate(plateNumber: string): Observable<any>{
    return this.http.get("http://10.1.0.102:3001/vehicles");
  }
}
