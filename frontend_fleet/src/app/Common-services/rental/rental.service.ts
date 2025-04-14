import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { CommonService } from '../common service/common.service';
import { Observable } from 'rxjs';
import { Rental } from '../../Models/Rental';

@Injectable({
  providedIn: 'root'
})
export class RentalService {

  private url: string = "rentals";

  constructor(
    private commonService: CommonService,
    private http: HttpClient,
    private cookieService: CookieService
  ) { }

  /**
   * Permette di ottenere tutte le rental
   * @returns observable http get
   */
  getAllRentals(): Observable<Rental[]>{
    const access_token = this.cookieService.get("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`
    });

    return this.http.get<Rental[]>(`${this.commonService.url}/${this.url}`, {headers});
  }
}
