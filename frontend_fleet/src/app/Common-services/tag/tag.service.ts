import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { CommonService } from '../common service/common.service';
import { Observable } from 'rxjs';
import { CookiesService } from '../cookies service/cookies.service';

export interface tagData{
  epc: string,
  timestamp: string,
  latitude: number,
  longitude: number
}
@Injectable({
  providedIn: 'root'
})
export class TagService {
  private _dateFrom = signal<Date | null>(null);
  private _dateTo = signal<Date | null>(null);


  constructor(
    private commonService: CommonService,
    private cookieService: CookiesService,
    private http: HttpClient
  ) { }

  /**
   * Permette di ottenere i tag letti da un veicolo in un arco di tempo
   * @param veId veId del veicolo
   * @param dateFrom data inizio periodo
   * @param dateTo data fine periodo
   * @returns observable http get
   */
  getTagsByVeIdRanged(veId: number): Observable<tagData>{
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    console.log(`${this.commonService.url}/tags?veId=${veId}&dateFrom=${this.formatDate(this.dateFrom())}&dateTo=${this.formatDate(this.dateTo())}`)

    return this.http.get<tagData>(`${this.commonService.url}/tags?veId=${veId}&dateFrom=${this.formatDate(this.dateFrom())}&dateTo=${this.formatDate(this.dateTo())}`,{ headers });

  }

  private formatDate(date: Date | null): string | null {
    if(date)
      return date.toISOString().split('T')[0];
    return null;
  }



  public get dateFrom() {
    return this._dateFrom;
  }
  public set dateFrom(value) {
    this._dateFrom = value;
  }
  public get dateTo() {
    return this._dateTo;
  }
  public set dateTo(value) {
    this._dateTo = value;
  }
}
