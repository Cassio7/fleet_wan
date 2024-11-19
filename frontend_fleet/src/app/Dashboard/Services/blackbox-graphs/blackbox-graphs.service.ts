import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BlackboxGraphsService {
  private _values = [60, 40];
  private _colors = ["#0061ff", "#009bff"];

  constructor() { }

  public get colors(): string[] {
    return this._colors;
  }

  public get values() {
    return this._values;
  }
}
