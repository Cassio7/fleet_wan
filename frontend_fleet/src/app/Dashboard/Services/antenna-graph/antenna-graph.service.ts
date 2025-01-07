import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class AntennaGraphService {
  private _graphTitle = "Antenna";

  private _series = [50,20,60];//[funzionante, warning, error]

  private _colors = ["#5C9074", "#d12717", "#000000"];

  private _height = 400;

  private _width = 300;

  private readonly _loadChartData$: BehaviorSubject<Vehicle[]> = new BehaviorSubject<Vehicle[]>([]);

  constructor() { }


  /*getters & setters*/
  public get graphTitle() {
    return this._graphTitle;
  }
  public set graphTitle(value) {
    this._graphTitle = value;
  }
  public get colors() {
    return this._colors;
  }
  public set colors(value) {
    this._colors = value;
  }
  public get series() {
    return this._series;
  }
  public set series(value) {
    this._series = value;
  }
  public get height() {
    return this._height;
  }
  public set height(value) {
    this._height = value;
  }
  public get width() {
    return this._width;
  }
  public set width(value) {
    this._width = value;
  }
  public get loadChartData$(): BehaviorSubject<Vehicle[]> {
    return this._loadChartData$;
  }
}
