import { ChangeDetectorRef, Injectable, OnInit } from '@angular/core';
import { VehiclesApiService } from '../vehicles/vehicles-api.service';
import { BehaviorSubject, lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})


export class BlackboxGraphsService{
  private _loadGraphData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private _series: number[] = [];
  private _colors = ["#0061ff", "#009bff"];

  constructor() { }




  private getAllRFIDVehicles(vehicles: any[]) {
    const categorizedVehicles = {
      blackboxOnly: [] as Vehicle[],
      blackboxWithAntenna: [] as Vehicle[],
    };

    for(const v of vehicles){
      v.isRFIDReader == true ? categorizedVehicles.blackboxWithAntenna.push(v) : categorizedVehicles.blackboxOnly.push(v);
    }

    return categorizedVehicles;
  }


  public loadChartData(vehicles: any[]){
    let series: number[] = [];
    try {
      const categorizedVehicles = this.getAllRFIDVehicles(vehicles);
      series = [
        categorizedVehicles.blackboxOnly.length,
        categorizedVehicles.blackboxWithAntenna.length,
      ];
    } catch (error) {
      console.error("Error loading chart data: ", error);
    }
    this._series = series;
    this._loadGraphData$.next(series);
  }

  public get loadGraphData$(): BehaviorSubject<any[]> {
    return this._loadGraphData$;
  }

  public get colors(): string[] {
    return this._colors;
  }

  public get series() {
    return this._series;
  }

}
