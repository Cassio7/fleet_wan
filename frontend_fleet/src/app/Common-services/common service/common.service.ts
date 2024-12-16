import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private _url: string = "http://10.1.0.102:3001";

  private _dateFrom: Date = new Date("2024-11-29");
  private _dateTo: Date = new Date("2024-11-30");
  constructor() { }

  public get url(): string {
    return this._url;
  }

  public get dateFrom(): Date {
    return this._dateFrom;
  }

  public set dateFrom(value: Date) {
    this._dateFrom = value;
  }

  public get dateTo(): Date {
    return this._dateTo;
  }

  public set dateTo(value: Date) {
    this._dateTo = value;
  }
}
