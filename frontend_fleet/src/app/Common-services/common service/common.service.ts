import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private _url: string = "http://10.1.0.102:3001/v0";

  constructor() {
  }

  public get url(): string {
    return this._url;
  }
}
