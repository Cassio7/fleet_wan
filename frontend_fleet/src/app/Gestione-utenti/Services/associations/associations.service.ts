import { Association } from './../../../Models/Association';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';
import { WorkSite } from '../../../Models/Worksite';
import { Company } from '../../../Models/Company';
import { CommonService } from '../../../Common-services/common service/common.service';

export interface getAssociationsResponse{
  associations: Association[],
  worksiteFree?: WorkSite[],
  companyFree?: Company[]
}
@Injectable({
  providedIn: 'root'
})
export class AssociationsService {

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private cookieService: CookieService
  ) { }


  /**
   * Permette di ottenere le associazioni di un utente tramite l'id
   * @param id id dell'utente di cui si vogliono ottenere le associazioni
   * @returns observable http get
   */
  getAssociationsByUserId(id: number): Observable<getAssociationsResponse>{
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    return this.http.get<getAssociationsResponse>(`${this.commonService.url}/associations/${id}`, {headers});
  }


  /**
   * Crea un'associazione di un utente con dei cantieri o delle società in base al ruolo di quest'ultimo
   * @param userId id dell'utente
   * @param worksiteIds id dei cantieri da associare
   * @param companyIds id delle società da associare
   * @returns observable http post
   */
  createAssociation(userId: number, worksiteIds?: number[], companyIds?: number[]): Observable<{message: string, association: Association[]}>{
    if(!worksiteIds && !companyIds){
      return of();
    }else{
      const access_token = this.cookieService.get('user');
      const headers = new HttpHeaders({
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      });

      const body = {
        id: userId,
        worksiteIds: worksiteIds,
        companyIds: companyIds
      };

      return this.http.post<{message: string, association: Association[]}>(`${this.commonService.url}/associations`, body, {headers});
    }
  }

  /**
   * Elimina un associazione tramite l'id di quest'ultima
   * @param id associazione da eliminare
   * @returns observable http delete
   */
  deleteAssociationById(id: number): Observable<{message: string}>{
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    return this.http.delete<{message: string}>(`${this.commonService.url}/associations/${id}`, {headers});
  }
}
