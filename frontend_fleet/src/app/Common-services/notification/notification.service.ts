import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notifica } from '../../Models/Notifica';
import { serverUrl } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _newNotification$: BehaviorSubject<Notifica | null> = new BehaviorSubject<Notifica | null>(null);
  private readonly _updatedNotification$: BehaviorSubject<Notifica | null> = new BehaviorSubject<Notifica | null>(null);
  private readonly _deletedNotification$: BehaviorSubject<{ key: string }> = new BehaviorSubject<{ key: string }>({ key: "" });

  private url: string = "notifications";

  constructor(
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

    return this.http.get<Notifica[]>(`${serverUrl}/${this.url}`, {headers});
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

    return this.http.get<Notifica[]>(`${serverUrl}/${this.url}`, { headers, params });
  }

  /**
   * Imposta lo stato di visualizzazione di una notifica alternando tra 'letta' o 'da leggere'
   * @param key key della notifica da modificare
   * @returns observable http patch
   */
  toggleNotificationReadStatus(key: string): Observable<{notification: Notifica, message: string}>{
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    return this.http.patch<{notification: Notifica, message: string}>(`${serverUrl}/notifications/${key}`, {}, {headers});
  }

  /**
   * Imposta tutte le notifiche "da leggere" o "letta" in base al parametro passato
   * @param toggle valore che determina se le notifiche verranno impostate a 'letta' (true) o a 'da leggere' (false)
   * @returns observable http patch
   */
  toggleAllNotificationToRead(toggle: boolean){
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    const params = new HttpParams().set("read", toggle.toString());

    return this.http.patch<{message: string}>(`${serverUrl}/notifications`, {}, {headers, params});
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

    return this.http.delete<{message: string, notification: Notifica}>(`${serverUrl}/${this.url}/${key}`, { headers });
  }

  public get newNotification$(): BehaviorSubject<Notifica | null> {
    return this._newNotification$;
  }
  public get updatedNotification$(): BehaviorSubject<Notifica | null> {
    return this._updatedNotification$;
  }
  public get deletedNotification$(): BehaviorSubject<{ key: string }> {
    return this._deletedNotification$;
  }
}
