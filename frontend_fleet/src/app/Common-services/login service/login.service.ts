import { WebsocketService } from './../websocket/websocket.service';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../common service/common.service';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly _logout$: Subject<void> = new Subject<void>();
  private readonly _login$: Subject<void> = new Subject<void>();

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookiesService: CookieService,
    private sessionStorageService: SessionStorageService,
    private websocketService: WebsocketService
  ) { }

  login(form: any): Observable<any>{
    const body = {
      username: form.username,
      password: form.password
    }
    return this.http.post<any>(`${this.commonService.url}/auth/login`, body);
  }

  logout(){
    this.cookiesService.deleteAll();
    this.sessionStorageService.clear();
    this.websocketService.disconnect()
  }

  public get logout$(): Subject<void> {
    return this._logout$;
  }
  public get login$(): Subject<void> {
    return this._login$;
  }
}
