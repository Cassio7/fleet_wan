import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private _url: string = "http://10.1.0.102:3001/v0";

  private _dateFrom: Date = new Date();
  private _dateTo: Date = new Date();

  constructor() {
    this.dateFrom.setHours(0, 0, 0, 0);
    this.dateTo.setHours(0, 0, 0, 0);
  }

  public get url(): string {
    return this._url;
  }

  public get dateFrom(): Date {
    return this._dateFrom;
  }

  public get dateTo(): Date {
    return this._dateTo;
  }
}
