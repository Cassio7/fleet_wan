import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CookiesService } from '../cookies service/cookies.service';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../common service/common.service';
import { SessionStorageService } from '../sessionStorage/session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private _login$: Subject<void> = new Subject<void>();

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private sessionStorageService: SessionStorageService,
    private cookieService: CookiesService
  ) { }

  login(form: any): Observable<any>{
    const body = {
      username: form.username,
      password: form.password
    }
    return this.http.post<any>(`${this.commonService.url}/auth/login`, body);
  }

  logout(){
    localStorage.removeItem("user");
    this.sessionStorageService.clear();
  }

  public get login$(): Subject<void> {
    return this._login$;
  }
}
