import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Workzone } from '../../Models/Workzone';
import { Observable } from 'rxjs';
import { serverUrl } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class WorkzoneService {

  private url: string = "workzone";

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) { }

  /**
   * Permette di ottenere tutte le workzone
   * @returns observable http get
   */
  getAllWorkzones(): Observable<Workzone[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Workzone[]>(`${serverUrl}/${this.url}`, {headers});
  }
}
