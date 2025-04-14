import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { CommonService } from '../common service/common.service';
import { Observable } from 'rxjs';
import { VehicleData } from '../../Models/VehicleData';
import { Vehicle } from '../../Models/Vehicle';
import { CookieService } from 'ngx-cookie-service';
import { Anomaly } from '../../Models/Anomaly';
import { Realtime } from '../../Models/Realtime';
import { Service } from '../../Models/Service';
import { WorkSite } from '../../Models/Worksite';


export interface RealtimeData {
  vehicle: {
    plate: string;
    worksite: WorkSite | null;
    veId: number;
    service?: Service | null;
  };
  realtime: Realtime;
  anomaly?: Anomaly;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeApiService {

  private url: string = "realtimes";
  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookieService: CookieService
  ) { }

  /**
   * Realizza la chiamata per il recupero dei dati delle ultime posizioni realtime dei veicoli
   * @returns JSON con i dati
   */
  getAllLastRealtime(): Observable<RealtimeData[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<RealtimeData[]>(`${this.commonService.url}/${this.url}/last`, {headers});
  }

  /**
   * Unisce un array di veicoli con uno di dati realtime
   * @param tableVehicles array di veicoli
   * @param realtimeData dati realtime
   * @returns veicoli accorpati
   */
  mergeVehiclesWithRealtime(tableVehicles: (VehicleData | Vehicle)[], realtimeData: RealtimeData[]): (VehicleData | Vehicle)[] {
    tableVehicles.forEach((vehicleData) => {
      if ('vehicle' in vehicleData) {
        const matchedRealtimeData = realtimeData.find((realtimeData) => {
          return realtimeData.vehicle.veId === vehicleData.vehicle.veId;
        });

        if (matchedRealtimeData) {
          vehicleData.realtime = matchedRealtimeData.realtime;
        }
      } else {
        const matchedRealtimeData = realtimeData.find((realtimeData) => {
          return realtimeData.vehicle.veId === vehicleData.veId;
        });

        if (matchedRealtimeData) {
          vehicleData.realtime = matchedRealtimeData.realtime;
        }
      }
    });

    return tableVehicles;
  }

}
