import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from '../../Common-services/map/map.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { VehicleData } from '../../Models/VehicleData';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Realtime } from '../../Models/Realtime';
import { RealtimeData } from '../../Models/RealtimeData';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  encapsulation: ViewEncapsulation.None
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();

  map!: L.Map;
  initialized: boolean = false;

  //parametri default per Perugia
  private lat: number = 43.1121;
  private long: number = 12.3888;

  constructor(private mapService: MapService,private cd: ChangeDetectorRef){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  ngAfterViewInit(): void {
    this.mapService.loadMap$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (realtimeData: RealtimeData | null) => {
        console.log("realtimData obtained: ", realtimeData);
        if(realtimeData){
          this.lat = realtimeData.realtime.latitude;
          this.long = realtimeData.realtime.longitude;

          this.initMap();
          const marker = this.mapService.createMarker(this.lat,this.long, realtimeData.vehicle.plate);
          this.mapService.addMarker(this.map, marker);
        }
      }
    });
  }

  private initMap(){
    this.initialized = true;
    this.cd.detectChanges();
    this.mapService.removeMap(this.map);
    this.map = this.mapService.initMap(this.map, this.lat, this.long);
  }
}
