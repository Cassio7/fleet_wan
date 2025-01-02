import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../check-errors/check-errors.service';

@Injectable({
  providedIn: 'root'
})
export class GpsGraphService {
  private _graphTitle = "GPS";

  private _series = [50,20,60];//[funzionante, warning, error]

  private _colors = ["#5C9074", "#ffcc00", "#d12717"];

  private _height = 400;

  private _width = 300;


  constructor(
    private checkErrorsService: CheckErrorsService,
    private sessionStorageService: SessionStorageService
  ) { }


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
}
