import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, last } from 'rxjs';
import { MapComponent } from "../../../Common-components/map/map.component";
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeApiService, RealtimeData } from '../../../Common-services/realtime-api/realtime-api.service';
import { MapFilterComponent } from "../map-filter/map-filter.component";
import { MappaInfoComponent } from "../mappa-info/mappa-info.component";
import { PointResearchComponent } from "../point-research/point-research.component";
import { Point } from '../../../Models/Point';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import L, { latLng, LayerGroup, Popup, popup } from 'leaflet';
import { VehicleRangeKm } from '@interfaces2/VehicleRangeKm.interface';

@Component({
  selector: 'app-home-map',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    MapFilterComponent,
    MappaInfoComponent,
    MatTooltipModule,
    MatSlideToggleModule,
    MatIconModule,
    PointResearchComponent
],
  templateUrl: './home-map.component.html',
  styleUrl: './home-map.component.css'
})
export class HomeMapComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  lastClickedPoint!: Point;
  lastClickedPointRange = signal(100);
  modeSwitch = signal(false)

  pointResearchMode: boolean = false;
  visiblePointSearchPlates: boolean = false;

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

  switchMode(){
    this.pointResearchMode = !this.pointResearchMode;
    this.modeSwitch.update(v => this.pointResearchMode);
  }

  loadSearchResults(searchResults: VehicleRangeKm[]) {
    this.mapService.removeMarkers$.next({type: "pointResearchMarker"})
    const markers: L.Marker[] = searchResults.map(res => {
      const closestPoint: Point = new Point(res.closest.lat, res.closest.long);
      const marker: L.Marker = this.mapService.createMarker(closestPoint, this.mapService.vehiclePointResearchMarker);

      (marker as any).type = "pointResearchMarker";

      marker.bindPopup(this.mapService.getCustomPopup(res.plate), {
        autoClose: false
      });
      if(this.visiblePointSearchPlates){
        marker.on("add", () => {
          marker.openPopup();
        })
      }
      return marker;
    });

    const layerGroup: L.LayerGroup = new LayerGroup(markers);

    this.mapService.loadLayerGroup$.next(layerGroup);
  }

}
