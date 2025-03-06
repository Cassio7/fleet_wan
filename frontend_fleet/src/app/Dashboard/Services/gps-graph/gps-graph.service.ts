import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { VehicleData } from '../../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class GpsGraphService {
  private _graphTitle = "GPS";

  private _series = [50,20,60];//[funzionante, warning, error]

  private _colors = ["#5C9074", "#C5D026", "#d12717"];

  private _height = 400;

  private _width = 300;

  private readonly _loadChartData$: BehaviorSubject<VehicleData[]> = new BehaviorSubject<VehicleData[]>([]);


  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }

  /**
   * Permette di preparare i dati per il caricamento del grafico dei gps
   * @param vehicles veicoli da analizzare
   * @returns array: [workingVehicles, warningVehicles, errorVehicles]
   */
  public loadChartData(vehicles: VehicleData[]) {
    this._series = [0, 0, 0]; // [working, warning, error]

    //controlli su gps e antenna
    const gpsCheckResult: VehicleData[][] = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);

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

  /**
   * Azzera i valori del grafico degli errori
   */
  resetGraph(){
    this.loadChartData$.next([]);
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
  public get loadChartData$(): Subject<VehicleData[]> {
    return this._loadChartData$;
  }
}
