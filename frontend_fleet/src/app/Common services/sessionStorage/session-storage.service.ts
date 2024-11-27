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

  getItem(key: string): any{
    if(this.checkSessionStorage()){
      return JSON.parse(sessionStorage.getItem(key) || "");
    }
    return [];
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

