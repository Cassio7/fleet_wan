import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import * as L from 'leaflet';
import { MapService } from '../../Common-services/map/map.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { VehicleData } from '../../Models/VehicleData';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Realtime } from '../../Models/Realtime';
import { RealtimeData } from '../../Models/RealtimeData';
import { Point } from '../../Models/Point';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();

  map!: L.Map;
  initialized: boolean = false;

  constructor(private mapService: MapService, private cd: ChangeDetectorRef) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private routingControl: L.Routing.Control | null = null;

  ngAfterViewInit(): void {
    this.mapService.loadMap$.pipe(takeUntil(this.destroy$), skip(1)).subscribe({
      next: (realtimeData: RealtimeData | null) => {
        if (realtimeData && realtimeData.realtime) {
          console.log(realtimeData.anomaly);
          const pgLat = realtimeData.realtime.latitude;
          const pgLong = realtimeData.realtime.longitude;
          this.initMap(new Point(pgLat, pgLong));
          const marker = this.mapService.createMarker(
            pgLat,
            pgLong,
            realtimeData.vehicle.plate,
            realtimeData.anomaly
          );
          this.mapService.addMarker(this.map, marker);
        }
      },
    });

    this.mapService.loadPath$.pipe(
      takeUntil(this.destroy$),
      skip(1)
    )
    .subscribe({
    next: (pathData: { plate: string, points: Point[] }) => {
      const startPoint: number = pathData.points[0].lat;
      const endPoint: number = pathData.points[0].long;

      this.initMap(new Point(startPoint, endPoint));

      // Remove previous routing control if it exists
      if (this.routingControl) {
          this.map.removeControl(this.routingControl);
          this.routingControl = null;
      }


      const waypoints = pathData.points.map((point) =>
          L.latLng(point.lat, point.long)
      );

      waypoints.forEach((waypoint, index) => {
        const newMarker = L.marker(waypoint);
        let popupContent = "";
        if (index === 0) {
            popupContent = "Inizio";
        } else if (index === waypoints.length - 1) {
            popupContent = "Fine";
        }

        if(index == 0 || index == waypoints.length -1){
          try {
            newMarker.addTo(this.map)
                .bindPopup(
                  this.mapService.getCustomPopup(popupContent),
                  {
                    autoClose: false
                  }
                )
                .openPopup();
          } catch (error) {
              console.error("Error creating marker:", error);
          }
        }
      });

      this.routingControl = L.Routing.control({
          waypoints: waypoints,
          routeWhileDragging: false,
          addWaypoints: false,
      }).addTo(this.map);

      this.routingControl.setWaypoints(waypoints);

      //Forza il ricalcolo del percorso. Utile in alcuni casi
      this.routingControl.route();

    },
    error: error => console.error("Errore nel caricamento del percorso: ", error)
  });


  }

  /**
   * Inizializza la mappa su un punto
   * @param point punto da cui inizializzare la mappa
   */
  private initMap(point: Point) {
    this.initialized = true;
    this.cd.detectChanges();
    if(this.map) this.mapService.removeMap(this.map);
    this.map = this.mapService.initMapByPoint(this.map, point);
  }

}
