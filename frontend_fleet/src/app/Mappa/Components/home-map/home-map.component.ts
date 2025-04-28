import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { MapComponent } from "../../../Common-components/map/map.component";
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeApiService, RealtimeData } from '../../../Common-services/realtime-api/realtime-api.service';
import { Point } from '../../../Models/Point';
import { MapFilterComponent } from "../map-filter/map-filter.component";
import { MappaInfoComponent } from "../mappa-info/mappa-info.component";

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    MapFilterComponent,
    MappaInfoComponent,
    MatTooltipModule,
    MatIconModule
],
  templateUrl: './home-map.component.html',
  styleUrl: './home-map.component.css'
})
export class HomeMapComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();


  constructor(
    private mapService: MapService,
    private realtimeApiService: RealtimeApiService
  ){}
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  vehicleSelected: boolean = false;

  ngAfterViewInit(): void {
    this.mapService.initMap$.next({
      point: new Point(43.112221, 12.388889),
      zoom: 9
    });
    this.realtimeApiService.getAllLastRealtime().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (realtimeData: RealtimeData[]) => {
        this.mapService.loadMultipleVehiclePositions$.next(realtimeData);
      },
      error: error => console.error("Errore nella ricerca dei dati realtime: ", error)
    });
  }
}
