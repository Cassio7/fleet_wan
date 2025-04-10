import { CommonService } from '../common service/common.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class VehiclesApiService {

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

    return this.http.get<Vehicle[]>(`${this.commonService.url}/vehicles`, { headers });
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

    return this.http.get<Vehicle[]>(`${this.commonService.url}/vehicles/admin`, { headers });
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

    return this.http.get<Vehicle[]>(`${this.commonService.url}/vehicles/admin`, { headers, params });
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
      `${this.commonService.url}/vehicles/fetchplate/${plate}`,
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
      `${this.commonService.url}/vehicles/${veId}`,
      { headers }
    );
  }

  public getVehicleByVeIdAdmin(veId: number): Observable<Vehicle> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Vehicle>(
      `${this.commonService.url}/vehicles/admin/${veId}`,
      { headers }
    );
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
