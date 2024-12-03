import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root'
})
export class CookiesService {

  constructor(private cookieService: CookieService) {}

  /**
   * Imposta un cookie
   * @param key chiave del cookie
   * @param value valore del cookie
   */
  setCookie(key: string, value: string) {
    this.cookieService.set(key, value);
  }

  /**
   * Ottiene un cookie
   * @param key chiave del cookie
   * @returns valore del cookie
   */
  getCookie(key: string) {
    return this.cookieService.get(key);
  }

  /**
   * Elimina un cookie
   * @param key chiave del cookie
   */
  deleteCookie(key: string) {
    this.cookieService.delete(key);
  }
}
