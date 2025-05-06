import { WebsocketService } from './../websocket/websocket.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { CookieService } from 'ngx-cookie-service';
import { serverUrl } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly _logout$: Subject<void> = new Subject<void>();
  private readonly _login$: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor(
    private http: HttpClient,
    private cookiesService: CookieService,
    private sessionStorageService: SessionStorageService,
    private websocketService: WebsocketService
  ) { }

  login(form: any): Observable<any>{
    const body = {
      username: form.username,
      password: form.password
    }
    return this.http.post<any>(`${serverUrl}/auth/login`, body);
  }

  logout(){
    this.cookiesService.deleteAll();
    this.sessionStorageService.clear();
    this.websocketService.disconnect()
  }

  public get logout$(): Subject<void> {
    return this._logout$;
  }
  public get login$(): BehaviorSubject<string> {
    return this._login$;
  }
}
