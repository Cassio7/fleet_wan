import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';

@Injectable({
  providedIn: 'root'
})
export class GpsGraphService {
  private _graphTitle = "GPS";

  private _series = [50,20,60];//[funzionante, warning, error]

  private _colors = ["#5C9074", "#ffcc00", "#d12717"];

  private _height = 400;

  private _width = 300;

  private readonly _loadChartData$: BehaviorSubject<Vehicle[]> = new BehaviorSubject<Vehicle[]>([]);


  constructor(
    private checkErrorsService: CheckErrorsService,
    private sessionStorageService: SessionStorageService
  ) { }

  /**
   * Permette di preparare i dati per il caricamento del grafico dei gps
   * @param vehicles veicoli da analizzare
   * @returns array: [workingVehicles, warningVehicles, errorVehicles]
   */
  public loadChartData(vehicles: Vehicle[]) {
    this._series = [0, 0, 0]; // [working, warning, error]

    //controlli su gps e antenna
    const gpsCheckResult: Vehicle[][] = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);

    const workingVehicles = Array.from(gpsCheckResult[0]);
    const warningVehicles = Array.from(gpsCheckResult[1]);
    const errorVehicles = Array.from(gpsCheckResult[2]);

    //impostazione series
    this._series = [
        workingVehicles.length,
        warningVehicles.length,
        errorVehicles.length
    ];

    return [workingVehicles, warningVehicles, errorVehicles];
}


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
  public get loadChartData$(): Subject<Vehicle[]> {
    return this._loadChartData$;
  }
}
