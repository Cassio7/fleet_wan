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

  public getAllTodaysVehicles(){

  }
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

  public checkGPSessionByVeid(veId: number): Observable<any>{
    const dateFrom = new Date();
    const dateTo = new Date();
    dateTo.setDate(dateTo.getDate() + 1); //Aumento di un giorno

    const body = {
      dateFrom: "2024-10-04",
      dateTo: "2024-10-05"
    };

    return this.http.post(`http://10.1.0.102:3001/session/checkgps/${veId}`, body);
  }
}
