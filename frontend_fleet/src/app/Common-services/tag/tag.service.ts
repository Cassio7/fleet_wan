import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { tagDownloadResponse } from '../../Scarico-letture/home-letture/home-letture.component';
import { serverUrl } from '../../environment';

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

    console.log(`${serverUrl}/tags?veId=${veId}&dateFrom=${this.dateFrom()}&dateTo=${this.dateTo()}`)

    return this.http.get<tagData[]>(`${serverUrl}/tags?veId=${veId}&dateFrom=${this.dateFrom()}&dateTo=${this.dateTo()}&less=true`,{ headers });

  }


  /**
   * Permette di scaricare i tag letti dai veicoli di un determinato cantiere in un range di tempo
   * @param workSiteId id del cantiere
   * @param dateFrom data di inizio ricerca
   * @param dateTo data di fine ricerca
   * @returns observable http get<Tag[]>
   */
  getDownloadTagsRangedPreview(workSiteIds: number[], dateFrom: string, dateTo: string): Observable<tagDownloadResponse> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    // Crea i parametri con i worksite
    let params = new HttpParams();

    // Aggiungi tutti i worksite come parametri multipli
    workSiteIds.forEach(id => {
      params = params.append('worksite', id.toString());
    });

    // Gestione di dateFrom
if (dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }

    // Gestione di dateTo
 if (dateTo) {
      params = params.set('dateTo', dateTo);
    }

    // Aggiungi il parametro preview
    params = params.set('preview', 'true');

    // Stampa dei parametri per debug (opzionale)
    console.log('Parametri inviati:', params.toString());

    return this.http.get<tagDownloadResponse>(`${serverUrl}/tags/download`, {
      headers,
      params
    });
  }

  downloadTagsRanged(worksiteIds: number[], dateFrom: string, dateTo: string): Observable<Blob> {
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    let params = new HttpParams()

    worksiteIds.forEach(worksiteId => {
      params = params.append('worksite', worksiteId.toString());
    })

    if(dateFrom) {
      params = params.set('dateFrom', dateFrom);
    }

    // Format dateTo properly
if(dateTo) {
      params = params.set('dateTo', dateTo);
    }

    // Add preview parameter to the query string
    return this.http.get(`${serverUrl}/tags/download`, {
      headers,
      params,
      responseType: 'blob'  // Crucial change: specify blob response type
    });
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
