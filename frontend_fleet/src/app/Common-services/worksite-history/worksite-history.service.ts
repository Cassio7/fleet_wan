import { Injectable } from '@angular/core';
import { WorksiteHistory } from '../../Models/Worksite-history';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { CommonService } from '../common service/common.service';

@Injectable({
  providedIn: 'root'
})
export class WorksiteHistoryService {

  private url: string = "worksitehistory";

  constructor(
    private commonService: CommonService,
    private http: HttpClient,
    private cookieService: CookieService
  ) { }

  /**
   * Permette di ottenere le worksite history di un veicolo tramite il suo veId
   * @param veId veId del veicolo di cui prendere gli worksite history
   * @returns observable http get
   */
  getWorksiteHistoryByVeIdAdmin(veId: number): Observable<WorksiteHistory[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<WorksiteHistory[]>(`${this.commonService.url}/${this.url}/admin/${veId}`, {headers});
  }
}
