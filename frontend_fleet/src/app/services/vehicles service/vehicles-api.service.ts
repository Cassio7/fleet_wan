import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicle } from '../../models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class VehiclesApiService {

  constructor(
    private http: HttpClient
  ) { }

  /**
   * Prende tutti i dati dei veicoli dall'api gestita nel backend
   * @returns
   */
  public getAllVehicles(): Observable<Vehicle[]>{
    return this.http.get<Vehicle[]>("http://10.1.0.102:3001/vehicles");
  }

  /**
   * Ricerca i dati del veicolo con una specifica targa
   * @param plate targa del veicolo da ricercare
   * @returns
   */
  public getVehicleByPlate(plate: string): Observable<Vehicle>{
    return this.http.get<Vehicle>(`http://10.1.0.102:3001/vehicles/fetchplate/${plate}`);
  }
}
