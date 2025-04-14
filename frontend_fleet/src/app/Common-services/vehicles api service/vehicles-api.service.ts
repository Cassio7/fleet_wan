import { CommonService } from '../common service/common.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';
import { CookieService } from 'ngx-cookie-service';


export interface vehicleUpdateData {
  active_csv: boolean;
  model_csv: string;
  euro: string;
  allestimento: boolean;
  registration: string;
  fleet_number: string;
  fleet_install: string;
  electrical: boolean;
  antenna_setting: string;
  fleet_antenna_number: string;
  retired_event: string;
  serviceId: number;
  equipmentId: number | null;
  rentalId: number | null;
}
@Injectable({
  providedIn: 'root'
})
export class VehiclesApiService {

  private url: string = "vehicles";

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookieService: CookieService
  ) { }

  /**
   * Prende tutti i dati dei veicoli dall'api gestita nel backend
   * @returns observable http
   */
  public getAllVehicles(): Observable<Vehicle[]> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Vehicle[]>(`${this.commonService.url}/${this.url}`, { headers });
  }

  /**
   * Prende tutti i dati dei veicoli dall'api gestita nel backend
   * @returns observable http
   */
  public getAllVehiclesAdmin(): Observable<Vehicle[]> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Vehicle[]>(`${this.commonService.url}/${this.url}/admin`, { headers });
  }

  /**
   * Permette di prendere tutti i veicoli non assegnati a nessun cantiere
   * @returns observable http get
   */
  public getAllFreeVehiclesAdmin(): Observable<Vehicle[]> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    // Correct way to set parameters
    const params = new HttpParams().set('free', 'true');

    return this.http.get<Vehicle[]>(`${this.commonService.url}/${this.url}/admin`, { headers, params });
  }


  /**
   * Ricerca i dati del veicolo con una specifica targa
   * @param plate targa del veicolo da ricercare
   * @returns observable http
   */
  public getVehicleByPlate(plate: string): Observable<Vehicle> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Vehicle>(
      `${this.commonService.url}/${this.url}/fetchplate/${plate}`,
      { headers }
    );
  }

  /**
   * Ricerca i dati del veicolo con uno specifico veId
   * @param veId veId del veicolo da ricercare
   * @returns observable http
   */
  public getVehicleByVeId(veId: number): Observable<Vehicle> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Vehicle>(
      `${this.commonService.url}/${this.url}/${veId}`,
      { headers }
    );
  }

  public getVehicleByVeIdAdmin(veId: number): Observable<Vehicle> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Vehicle>(
      `${this.commonService.url}/${this.url}/admin/${veId}`,
      { headers }
    );
  }

  /**
   * Permette di aggiornare un veicolo tramite il suo veId
   * @param veId veId del veicolo da modificare
   * @param vehicleUpdateData dati aggiornati del veicolo
   * @returns observable http patch
   */
  public updateVehicleByVeId(veId: number, vehicleUpdateData: vehicleUpdateData): Observable<Vehicle>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.put<Vehicle>(`${this.commonService.url}/${this.url}/${veId}`, vehicleUpdateData, {headers});
  }

  /**
   * Permette di ottenere lo storico dei cantieri di un veicolo
   * @param veId veId del veicolo
   */
  public getVehicleWorksiteHistoryByVeId(veId: number){
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Vehicle>(
      `${this.commonService.url}/worksitehistory/${veId}`,
      { headers }
    );
  }
}
