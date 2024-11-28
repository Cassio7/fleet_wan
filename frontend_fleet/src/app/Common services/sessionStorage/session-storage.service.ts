import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {

  constructor() { }

  checkSessionStorage(): boolean{
    if(typeof sessionStorage != "undefined"){
      return true;
    }else{
      return false;
    }
  }

  setItem(key: string, value: any): void {
    if(this.checkSessionStorage()){
      sessionStorage.setItem(key, value);
    }
  }

  getItem(key: string): any {
    if (this.checkSessionStorage()) {
      const value = sessionStorage.getItem(key);

      // Se il valore è presente e non è una stringa vuota
      if (value) {
        try {
          return JSON.parse(value);  // Parsing sicuro
        } catch (error) {
          console.error('Errore durante il parsing del valore:', error);
          return null; // Restituisci null in caso di errore di parsing
        }
      }

      // Se il valore non esiste o è vuoto, restituisci null o un oggetto di fallback
      return null;
    }
    return null; // Se sessionStorage non è disponibile
  }


  removeItem(key: string): void {
    if(this.checkSessionStorage()){
      sessionStorage.removeItem(key);
    }
  }

  clear(): void {
    if(this.checkSessionStorage()){
      sessionStorage.clear();
    }
  }
}

