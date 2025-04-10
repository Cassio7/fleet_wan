import { Injectable } from '@angular/core';
import { Equipment } from '../../Models/Equipment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { CommonService } from '../common service/common.service';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {

  constructor(
    private commonService: CommonService,
    private http: HttpClient,
    private cookieService: CookieService
  ) { }

  /**
   * Permette di ottenere tutti gli equipment
   * @returns observable http get
   */
  getAllEquipments(): Observable<Equipment[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Equipment[]>(`${this.commonService.url}/equipments`, {headers});
  }
}
