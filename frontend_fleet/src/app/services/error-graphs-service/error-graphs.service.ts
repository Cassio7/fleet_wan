import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorGraphsService {
  private _values = [44, 55, 13];
  private _colors = ["#46ff00", "#ffd607", "#ff0000"];

  constructor() { }

  public get colors() {
    return this._colors;
  }
  public get values() {
    return this._values;
  }
}
