import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from '../../Common-services/map/map.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { VehicleData } from '../../Models/VehicleData';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit {
  private readonly destroy$: Subject<void> = new Subject<void>();

  private map!: L.Map;
  //parametri default per Perugia
  private lat: number = 43.1121;
  private long: number = 12.3888;

  constructor(private mapService: MapService){}


  ngAfterViewInit(): void {
    this.initMap();
    this.mapService.loadMap$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicleData: VehicleData | null) => {
        if(vehicleData && vehicleData.realtime){
          console.log("CARICAMA AAA MAPPA A SCEMI");
          this.lat = vehicleData.realtime.latitude;
          this.long = vehicleData.realtime.longitude;

          this.initMap();
        }
      }
    });
  }

  private initMap(){
    this.mapService.removeMap(this.map);
    this.map = this.mapService.initMap(this.map, this.lat, this.long);

    const marker = this.mapService.createMarker(this.lat,this.long, "Punto nella mappa di Perugia");
    this.mapService.addMarker(this.map, marker);
  }
}
