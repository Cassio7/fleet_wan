import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from '../../Common-services/map/map.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { VehicleData } from '../../Models/VehicleData';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();

  map!: L.Map;
  initialized: boolean = false;

  //parametri default per Perugia
  private lat: number = 43.1121;
  private long: number = 12.3888;

  constructor(private mapService: MapService){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  ngAfterViewInit(): void {
    this.mapService.loadMap$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicleData: VehicleData | null) => {
        if(vehicleData && vehicleData.realtime){
          this.lat = vehicleData.realtime.latitude;
          this.long = vehicleData.realtime.longitude;

          this.initMap();
          const marker = this.mapService.createMarker(this.lat,this.long, vehicleData.vehicle.plate);
          this.mapService.addMarker(this.map, marker);
        }
      }
    });
  }

  private initMap(){
    this.initialized = true;
    this.mapService.removeMap(this.map);
    this.map = this.mapService.initMap(this.map, this.lat, this.long);
  }
}
