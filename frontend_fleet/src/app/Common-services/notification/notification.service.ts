import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonService } from '../common service/common.service';
import { Notifica } from '../../Models/Notifica';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _updatedNotification$: BehaviorSubject<Notifica | null> = new BehaviorSubject<Notifica | null>(null);
  private readonly _deletedNotification$: BehaviorSubject<{ key: string }> = new BehaviorSubject<{ key: string }>({ key: "" });

  private url: string = "notifications";

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

    return this.http.get<Notifica[]>(`${this.commonService.url}/${this.url}`, {headers});
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

    return this.http.get<Notifica[]>(`${this.commonService.url}/${this.url}`, { headers, params });
  }

  /**
   * Elimina una notifica tramite la chiave
   * @param key chiave della notifica da eliminare
   * @returns observable http delete
   */
  deleteNotification(key: string): Observable<{message: string, notification: Notifica}>{
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    return this.http.delete<{message: string, notification: Notifica}>(`${this.commonService.url}/${this.url}/${key}`, { headers });
  }

  public get updatedNotification$(): BehaviorSubject<Notifica | null> {
    return this._updatedNotification$;
  }
  public get deletedNotification$(): BehaviorSubject<{ key: string }> {
    return this._deletedNotification$;
  }
}
