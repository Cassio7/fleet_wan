import { AfterViewInit, Component } from '@angular/core';
import { MapComponent } from "../../../Common-components/map/map.component";
import { MapService } from '../../../Common-services/map/map.service';
import { map } from 'leaflet';
import { Point } from '../../../Models/Point';
import { RealtimeApiService } from '../../../Common-services/realtime-api/realtime-api.service';
import { Subject, takeUntil } from 'rxjs';
import { RealtimeData } from '../../../Models/RealtimeData';
import { MapFilterComponent } from "../map-filter/map-filter.component";
import { MappaInfoComponent } from "../mappa-info/mappa-info.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    MapFilterComponent,
    MappaInfoComponent
  ],
  templateUrl: './home-map.component.html',
  styleUrl: './home-map.component.css'
})
export class HomeMapComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();
  constructor(
    private mapService: MapService,
    private realtimeApiService: RealtimeApiService
  ){}

  vehicleSelected: boolean = false;

  ngAfterViewInit(): void {
    this.mapService.initMap$.next({
      point: new Point(43.112221, 12.388889),
      zoom: 9
    });
    this.realtimeApiService.getAllLastRealtime().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (realtimeData: RealtimeData[]) => {
        realtimeData.forEach(data => {
          this.mapService.loadPosition$.next(data);
        });
      },
      error: error => console.error("Errore nella ricerca dei dati realtime: ", error)
    });
  }
}
