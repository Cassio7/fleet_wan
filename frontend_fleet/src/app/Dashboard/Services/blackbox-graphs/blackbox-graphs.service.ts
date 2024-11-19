import { ChangeDetectorRef, Injectable, OnInit } from '@angular/core';
import { VehiclesApiService } from '../vehicles/vehicles-api.service';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})


export class BlackboxGraphsService{
  private readonly destroy$: Subject<void> = new Subject<void>();
  private _values = [60, 40];
  private _colors = ["#0061ff", "#009bff"];

  constructor(
    private vehicleApiService: VehiclesApiService
  ) { }


  public get colors(): string[] {
    return this._colors;
  }

  public get values() {
    return this._values;
  }

  public async getAllRFIDVehicles() {
    const categorizedVehicles = {
      blackboxOnly: [] as Vehicle[],
      blackboxWithAntenna: [] as Vehicle[],
    };

    try {
      const vehicles: Vehicle[] = await lastValueFrom(
        this.vehicleApiService.getAllVehicles().pipe(takeUntil(this.destroy$))
      );

      for (const vehicle of vehicles) {
        vehicle.isRFIDReader
          ? categorizedVehicles.blackboxWithAntenna.push(vehicle)
          : categorizedVehicles.blackboxOnly.push(vehicle);
      }
    } catch (error) {
      console.error('Error getting all vehicles for RFID checking:', error);
    }

    return categorizedVehicles;
  }


}
