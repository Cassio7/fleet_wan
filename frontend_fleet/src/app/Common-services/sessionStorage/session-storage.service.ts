import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  constructor() { }
  /**
   * Verifica se sessionStorage è disponibile nell'ambiente corrente.
   * @returns {boolean} Ritorna true se sessionStorage è definito, altrimenti false.
   */
  checkSessionStorage(): boolean {
    if (typeof sessionStorage !== "undefined") {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Memorizza una coppia chiave-valore in sessionStorage se sessionStorage è disponibile.
   * @param {string} key - La chiave sotto la quale il valore viene memorizzato.
   * @param {any} value - Il valore da memorizzare.
   */
  setItem(key: string, value: any): void {
    if (this.checkSessionStorage()) {
      sessionStorage.setItem(key, value);
    }
  }

  /**
   * Recupera il valore associato a una data chiave da sessionStorage se sessionStorage è disponibile.
   * @param {string} key - La chiave per cui si desidera ottenere il valore.
   * @returns {any} Ritorna il valore associato alla chiave se presente; altrimenti, ritorna un array vuoto.
   */
  getItem(key: string): any {
    if (this.checkSessionStorage()) {
      return sessionStorage.getItem(key);
    }
    return [];
  }

  /**
   * Rimuove l'elemento associato a una specifica chiave da sessionStorage se sessionStorage è disponibile.
   * @param {string} key - La chiave dell'elemento da rimuovere.
   */
  removeItem(key: string): void {
    if (this.checkSessionStorage()) {
      sessionStorage.removeItem(key);
    }
  }

  /**
   * Pulisce tutti i dati memorizzati in sessionStorage se sessionStorage è disponibile.
   */
  clear(): void {
    if (this.checkSessionStorage()) {
      sessionStorage.clear();
    }
  }

}

