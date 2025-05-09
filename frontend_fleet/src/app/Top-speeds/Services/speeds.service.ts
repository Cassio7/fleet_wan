import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { serverUrl } from '../../environment';

export interface SpeedData{
  plate: string,
  veId: number,
  speed: number
}
export interface TopSpeedsData{
  yesterday: SpeedData[],
  thisMonth: SpeedData[],
  last3Months: SpeedData[],
  thisYear: SpeedData[],
  allTime: SpeedData[]
}
@Injectable({
  providedIn: 'root'
})
export class SpeedsService {

  constructor(
    private cookieService: CookieService,
    private http: HttpClient
  ) { }

  /**
   * Permette di ottenere la classifica delle maggiori velocità rilevate di sempre, di ieri, di questo mese, di 3 mesi fa e dell'anno scorso
   * @returns observable http get
   */
  getTopSpeeds(): Observable<TopSpeedsData>{
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    return this.http.get<TopSpeedsData>(`${serverUrl}/speed`, {headers});
  }
}
