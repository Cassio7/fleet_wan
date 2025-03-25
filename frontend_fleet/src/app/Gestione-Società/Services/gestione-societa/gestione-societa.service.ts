import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { CommonService } from '../../../Common-services/common service/common.service';
import { Observable } from 'rxjs';
import { Company } from '../../../Models/Company';

@Injectable({
  providedIn: 'root'
})
export class GestioneSocietaService {
  societaFilter: WritableSignal<String[]> = signal([]);

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookieService: CookieService
  ) { }

  getAllSocieta(): Observable<Company[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<Company[]>(`${this.commonService.url}/companies`, {headers});
  }

  // editSocieta(id: number, suId: number, newCompany: Company): Observable<Company[]>{
  //   const access_token = this.cookieService.get("user");
  //   const headers = new HttpHeaders({
  //     'Authorization': `Bearer ${access_token}`,
  //     'Content-Type': 'application/json'
  //   });

  //   const params: HttpParams = new HttpParams();

  //   params.set("id", company.id);

  //   const body = {
  //     suId: suId,
  //     name: newCompany.name
  //   }
  // }

  /**
   * Permette di cancellare una società tramite una chiamata API
   * @param companyId id della società da eliminare
   * @returns observable http delete
   */
  deleteCompany(companyId: number){
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    return this.http.delete<Company>(`${this.commonService.url}/companies/${companyId}`, {headers});
  }
}
