import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { CookiesService } from '../cookies service/cookies.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private cookieService: CookiesService
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

  /**
   * Decodifica il token d'accesso con le informazioni dell'utente
   * @returns l'oggetto contenente le informazioni dell'utente
   */
  getUserInfo(){
    const access_token = this.cookieService.getCookie("user");
    return this.decodeToken(access_token);
  }
}
