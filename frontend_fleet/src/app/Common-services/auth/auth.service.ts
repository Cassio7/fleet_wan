import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { CookiesService } from '../cookies service/cookies.service';
import { User } from '../../Models/User';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonService } from '../common service/common.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private commonService: CommonService,
    private cookieService: CookiesService,
    private http: HttpClient
  ) { }

  /**
   * Decodifica un token JWT
   * @param token token JWT da decodificare
   * @returns token decodificato
   */
  decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Errore durante la decodifica del token:', error);
      return null;
    }
  }

  getUserInfo(){
    const access_token = this.cookieService.getCookie("user");
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    });


    return this.http.get<User>(`${this.commonService.url}/users/me`, {headers});
  }



  /**
   * Decodifica il token d'accesso con le informazioni dell'utente
   * @returns l'oggetto contenente le informazioni dell'utente
   */
  getParsedAccessToken(): User{
    const access_token = this.cookieService.getCookie("user");
    return this.decodeToken(access_token);
  }
}
