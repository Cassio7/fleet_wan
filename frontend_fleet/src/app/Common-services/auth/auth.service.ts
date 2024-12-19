import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { }

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
}
