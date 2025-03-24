import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { CommonService } from '../common service/common.service';
import { Observable, of } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { Tag } from '../../Models/Tag';
import { tagDownloadResponse } from '../../Scarico-letture/home-letture/home-letture.component';

export interface tagData{
  epc: string,
  timestamp: string,
  latitude: number,
  longitude: number
}
export interface TagDownloadData {
  epc: string;
  detectionQuality: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  plate: string;
  worksite: string;
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
   * Permette di scaricare i tag letti dai veicoli di un determinato cantiere in un range di tempo
   * @param workSiteId id del cantiere
   * @param dateFrom data di inizio ricerca
   * @param dateTo data di fine ricerca
   * @returns observable http get<Tag[]>
   */
  downloadTagRanged(workSiteId: number, dateFrom: Date | string, dateTo: Date | string): Observable<tagDownloadResponse>{
    console.log('date from: ', dateFrom);
    console.log('date to: ', dateTo);
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    let params = new HttpParams().set('worksite', workSiteId.toString());

    // Format dateFrom properly
    if(dateFrom instanceof Date) {
      params = params.set('dateFrom', this.formatDate(dateFrom) || '');
    } else if(dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }

    // Format dateTo properly
    if(dateTo instanceof Date) {
      params = params.set('dateTo', this.formatDate(dateTo) || '');
    } else if(dateTo) {
      params = params.set('dateTo', dateTo);
    }

    // Add preview parameter to the query string
    params = params.set("preview", 'true');

    return this.http.get<tagDownloadResponse>(`${this.commonService.url}/tags/download`, {headers, params});
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
