import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private _notifySidebar$: Subject<void> = new Subject();
  private _url: string = "http://10.1.0.102:3001";

  private _dateFrom: Date = new Date("2024-11-20");
  private _dateTo: Date = new Date("2024-11-21");
  constructor() { }

  public get notifySidebar$(): Subject<void> {
    return this._notifySidebar$;
  }

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
