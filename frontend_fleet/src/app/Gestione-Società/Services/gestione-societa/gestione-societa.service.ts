import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { Company } from '../../../Models/Company';
import { serverUrl } from '../../../environment';

@Injectable({
  providedIn: 'root'
})
export class GestioneSocietaService {
  societaFilter: WritableSignal<String[]> = signal([]);

  private url: string = "companies";

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) { }

  getAllSocieta(): Observable<Company[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<Company[]>(`${serverUrl}/${this.url}`, {headers});
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


  createCompany(suId: number, name: string): Observable<{message: string, company: Company}>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      suId: suId,
      name: name
    }

    return this.http.post<{message: string, company: Company}>(`${serverUrl}/${this.url}`, body, {headers});
  }

  updateCompany(companyId: number, newCompany: Company): Observable<Company>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      suId: newCompany.suId,
      name: newCompany.name
    }

    return this.http.put<Company>(`${serverUrl}/${this.url}/${companyId}`, body, {headers})
  }

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

    return this.http.delete<Company>(`${serverUrl}/${this.url}/${companyId}`, {headers});
  }
}
