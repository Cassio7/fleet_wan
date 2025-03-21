import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DetectionQuality } from '../../../Models/DetectionQuality';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonService } from '../../../Common-services/common service/common.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class DetectionGraphService {
  private _colors: string[] = ["#5C9074"];

  constructor(
    private commonService: CommonService,
    private http: HttpClient,
    private cookiesService: CookieService
  ) { }

  /**
   * Permette di prendere dal database tutte le qualità di lettura registrate da un veicolo
   * @param veId veId del veicolo di cui ricercare la qualità delle letture
   * @returns observable http post
   */
  getDetectionQualityByVeId(
    body: {
      veId: number,
      months: number,
      days: number
    }
  ): Observable<DetectionQuality[]>{
    const access_token = this.cookiesService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<DetectionQuality[]>(`${this.commonService.url}/tags/detection`, body, {headers});
  }

  public get colors(): string[] {
    return this._colors;
  }
  public set colors(value: string[]) {
    this._colors = value;
  }
}
