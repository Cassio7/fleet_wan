import { CommonService } from '../common service/common.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';

export interface mezziData {
  plates: any[];
  modelli: any[];
  firstEvents: Date[];
}
@Injectable({
  providedIn: 'root'
})
export class VehiclesApiService {
  private _mezziData: mezziData = {
    plates: [],
    modelli: [],
    firstEvents: [],
  };


  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) { }

  /**
   * Prende tutti i dati dei veicoli dall'api gestita nel backend
   * @returns observable http
   */
  public getAllVehicles(): Observable<Vehicle[]>{
    return this.http.get<Vehicle[]>("http://10.1.0.102:3001/vehicles");
  }

  public fillMezziData(vehicles: Vehicle[]){
    vehicles.forEach(vehicle => {
      this.mezziData.plates.push(vehicle.plate);//aggiunta targa
      this.mezziData.modelli.push(vehicle.model);//aggiunta modelli (da fare poi)
      if(vehicle.firstEvent){
        this.mezziData.firstEvents.push(vehicle.firstEvent);//aggiunta first event
      }
    });
    return this.mezziData;
  }

  /**
   * Ricerca i dati del veicolo con una specifica targa
   * @param plate targa del veicolo da ricercare
   * @returns observable http
   */
  public getVehicleByPlate(plate: string): Observable<Vehicle>{
    return this.http.get<Vehicle>(`http://10.1.0.102:3001/vehicles/fetchplate/${plate}`);
  }

  /**
   * Controlla il GPS di un veicolo
   * @param veId identificativo del veicolo
   * @returns observable http
   */
  public checkGPSessionByVeid(veId: number): Observable<any>{
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;
    dateTo.setDate(dateTo.getDate() + 1); //Aumento di un giorno

    //da modificare
    const body = {
      dateFrom: "2024-10-31",
      dateTo: "2024-11-01"
    };

    return this.http.post(`http://10.1.0.102:3001/session/checkgps/${veId}`, body);
  }

  /**
   * Controlla i GPS di tutti i veicoli in un determinato arco di tempo
   * @param dateFrom data di inizio ricerca
   * @param dateTo data di fine ricerca
   * @returns observable http
   */
  public checkGPSAllRanged(dateFrom: Date, dateTo: Date){
    const body = {
      dateFrom: dateFrom,
      dateTo: dateTo
    }
    return this.http.post<Vehicle[]>("http://10.1.0.102:3001/session/checkgps/all", body);
  }

  /**
   * Controlla tutti i GPS nella giornata di oggi
   * @returns observable http
   */
  public checkGPSAllToday(){
    const body = {
      dateFrom: new Date(this.commonService.dateFrom),
      dateTo: new Date(this.commonService.dateTo)
      // dateTo: new Date(new Date().setDate(new Date().getDate() + 1))
    };
    return this.checkGPSAllRanged(body.dateFrom, body.dateTo); //da cambiare in data di ieri e attuale
  }


  public get mezziData() {
    return this._mezziData;
  }
  public set mezziData(value) {
    this._mezziData = value;
  }
}
