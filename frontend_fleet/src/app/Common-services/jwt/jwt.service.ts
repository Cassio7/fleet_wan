import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  constructor() { }

  /**
   * converte un token jwt in json
   * @param token token da convertire
   * @returns oggetto json
   */
  decodeJwt(token: string): any {
    if (!token) {
      throw new Error('JWT non fornito.');
    }

    const payload = token.split('.')[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload); // Conversione della stringa decodificata in oggetto JSON
  }
}
