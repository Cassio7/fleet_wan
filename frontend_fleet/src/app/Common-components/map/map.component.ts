import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';
import { MapService } from '../../Common-services/map/map.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map;
  private lat: number = 43.1121;
  private long: number = 12.3888;

  constructor(private mapService: MapService){}


  ngAfterViewInit(): void {
    this.map = this.mapService.initMap(this.map, this.lat, this.long);

    const marker = this.mapService.createMarker(this.lat,this.long, "Punto nella mappa di Perugia");
    this.mapService.addMarker(this.map, marker);
  }
}
