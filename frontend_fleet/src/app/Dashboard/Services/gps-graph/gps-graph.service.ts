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
  public get graphTitle() {
    return this._graphTitle;
  }
  public set graphTitle(value) {
    this._graphTitle = value;
  }
  private _series = [50,20,60];//[funzionante, warning, error]
  public get series() {
    return this._series;
  }
  public set series(value) {
    this._series = value;
  }
  private _colors = ["#5C9074", "#ffcc00", "#d12717"];
  public get colors() {
    return this._colors;
  }
  public set colors(value) {
    this._colors = value;
  }
  private _height = 400;
  public get height() {
    return this._height;
  }
  public set height(value) {
    this._height = value;
  }
  private _width = 300;
  public get width() {
    return this._width;
  }
  public set width(value) {
    this._width = value;
  }


  private _firstLoad = true;
  public get firstLoad() {
    return this._firstLoad;
  }
  public set firstLoad(value) {
    this._firstLoad = value;
  }

  constructor(
    private checkErrorsService: CheckErrorsService,
    private sessionStorageService: SessionStorageService
  ) { }


  /*getters & setters*/

}
