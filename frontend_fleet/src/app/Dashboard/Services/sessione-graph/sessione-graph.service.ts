import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VehicleData } from '../../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class SessioneGraphService {
  private _graphTitle = "Sessione";

  private _series = [50,60];//[funzionante, error]

  private _colors = ["#5C9074", "#D02626"];

  private readonly _loadChartData$: BehaviorSubject<VehicleData[]> = new BehaviorSubject<VehicleData[]>([]);

  constructor() { }

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
  public get loadChartData$(): BehaviorSubject<VehicleData[]> {
    return this._loadChartData$;
  }
}
