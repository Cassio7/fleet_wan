import { Injectable } from '@angular/core';
import { Notifica } from '../../../Models/Notifica';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonService } from '../../../Common-services/common service/common.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationsFilterService {

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookieService: CookieService
  ) { }

  /**
   * Filtra delle notifiche in base ad una ricerca sull'username dell'autore di quest'ultime
   * @param notifiche notifiche da filtrare
   * @param usernameResearch ricerca per username
   * @returns array di notifiche filtrato
   */
  filterNotificationsByUsername(notifiche: Notifica[], usernameResearch: string): Notifica[]{
    if(usernameResearch){
      return notifiche.filter(notifica => {
        return notifica.author.includes(usernameResearch);
      })
    }else{
      return notifiche;
    }
  }

  updateNotificationReadStatus(key: string): Observable<{notification: Notifica, message: string}>{
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    return this.http.patch<{notification: Notifica, message: string}>(`${this.commonService.url}/notifications/${key}`, {}, {headers});
  }
}
