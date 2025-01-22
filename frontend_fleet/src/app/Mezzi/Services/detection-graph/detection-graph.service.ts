import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DetectionGraphService {
  private _colors: string[] = ["#5C9074"];

  constructor() { }



  public get colors(): string[] {
    return this._colors;
  }
  public set colors(value: string[]) {
    this._colors = value;
  }
}
