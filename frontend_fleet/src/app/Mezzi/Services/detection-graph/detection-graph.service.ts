import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DetectionQuality } from '../../../Models/DetectionQuality';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookiesService } from '../../../Common-services/cookies service/cookies.service';
import { CommonService } from '../../../Common-services/common service/common.service';

@Injectable({
  providedIn: 'root'
})
export class DetectionGraphService {
  private _colors: string[] = ["#5C9074"];

  constructor(
    private commonService: CommonService,
    private http: HttpClient,
    private cookiesService: CookiesService
  ) { }

  /**
   * Permette di prendere dal database tutte le qualità di lettura registrate da un veicolo
   * @param veId veId del veicolo di cui ricercare la qualità delle letture
   * @returns observable http post
   */
  getDetectionQualityByVeId(veId: number): Observable<DetectionQuality[]>{
    const access_token = this.cookiesService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      veId: veId
    };
    return this.http.post<DetectionQuality[]>(`http://10.1.0.102:3002/v0/tag/detection`, body, {headers});
  }

  public get colors(): string[] {
    return this._colors;
  }
  public set colors(value: string[]) {
    this._colors = value;
  }
}
