import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { CommonService } from '../common service/common.service';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';

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
    private cookieService: CookieService,
    private http: HttpClient
  ) { }

  /**
   * Permette di ottenere i tag letti da un veicolo in un arco di tempo
   * @param veId veId del veicolo
   * @param dateFrom data inizio periodo
   * @param dateTo data fine periodo
   * @returns observable http get
   */
  getTagsByVeIdRanged(veId: number): Observable<tagData[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    console.log(`${this.commonService.url}/tags?veId=${veId}&dateFrom=${this.dateFrom()}&dateTo=${this.dateTo()}`)

    return this.http.get<tagData[]>(`${this.commonService.url}/tags?veId=${veId}&dateFrom=${this.dateFrom()}&dateTo=${this.dateTo()}&less=true`,{ headers });

  }

  private formatDate(date: Date | null): string | null {
    if(date)
      return date.toISOString().split('T')[0];
    return null;
  }

  /**
   * Imposta il range di tempo nel servizio
   * @param dateFrom data di inizio
   * @param dateTo data di fine
   */
  setTimeRange(dateFrom: Date, dateTo: Date){
    this._dateFrom.set(dateFrom);
    this._dateTo.set(dateTo);
  }

  /**
   * Permette di ottenere il time range impostato nei signal del servizio
   * @returns oggetto {dateFrom, dateTo}
   */
  getTimeRange(){
    return {
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo()
    }
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
