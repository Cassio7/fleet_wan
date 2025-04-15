import { Injectable } from '@angular/core';
import { Service } from '../../Models/Service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { serverUrl } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  private url: string = "services";

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) { }

  /**
   * Permette di ottenere tutti i service
   * @returns observable http get
   */
  getAllServices(): Observable<Service[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Service[]>(`${serverUrl}/${this.url}`, {headers});
  }
}
