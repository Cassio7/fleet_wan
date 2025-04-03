import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { CommonService } from '../common service/common.service';

export interface Notifica {
  key: string;
  title: string;
  message: string;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private commonService: CommonService,
    private cookieService: CookieService,
    private http: HttpClient
  ) { }

  /**
   * Permette di ottenere tutte le notifiche arrivate all'admin
   * @returns observable http get
   */
  getAllNotifications(): Observable<Notifica[]>{
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    return this.http.get<Notifica[]>(`${this.commonService.url}/notifications`, {headers});
  }
}
