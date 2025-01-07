import { CommonService } from '../common service/common.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';
import { CookiesService } from '../cookies service/cookies.service';

@Injectable({
  providedIn: 'root'
})
export class VehiclesApiService {

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookieService: CookiesService
  ) { }

  /**
   * Prende tutti i dati dei veicoli dall'api gestita nel backend
   * @returns observable http
   */
  public getAllVehicles(): Observable<Vehicle[]> {
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Vehicle[]>(`${this.commonService.url}/vehicles`, { headers });
  }

  /**
   * Ricerca i dati del veicolo con una specifica targa
   * @param plate targa del veicolo da ricercare
   * @returns observable http
   */
  public getVehicleByPlate(plate: string): Observable<Vehicle> {
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Vehicle>(
      `http://10.1.0.102:3001/vehicles/fetchplate/${plate}`,
      { headers }
    );
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

    //da modificare con le variabili
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
}
