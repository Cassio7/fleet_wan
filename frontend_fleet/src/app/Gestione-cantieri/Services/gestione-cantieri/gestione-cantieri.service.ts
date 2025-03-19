import { Injectable, signal, WritableSignal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WorkSite } from '../../../Models/Worksite';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonService } from '../../../Common-services/common service/common.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class GestioneCantieriService {
  cantieriFilter: WritableSignal<String[]> = signal([]);

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookieService: CookieService
  ) { }

  getAllWorksite(): Observable<WorkSite[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<WorkSite[]>(`${this.commonService.url}/worksites`, {headers});
  }
}
