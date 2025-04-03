import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { CommonService } from '../common service/common.service';
import { Notifica } from '../../Models/Notifica';

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

  /**
   * Permette di ottenere le notifiche da leggere
   * @returns observable http get
   */
  getToReadNotifications(): Observable<Notifica[]> {
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    const params = new HttpParams().set('read', 'false');

    return this.http.get<Notifica[]>(`${this.commonService.url}/notifications`, { headers, params });
  }

  /**
   * Elimina una notifica tramite la chiave
   * @param key chiave della notifica da eliminare
   * @returns observable http delete
   */
  deleteNotification(key: string){
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    return this.http.delete<Notifica[]>(`${this.commonService.url}/notifications/${key}`, { headers });
  }
}
