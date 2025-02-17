import { History } from './../../Models/History';
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

    this.mapService.loadSessionPath$.pipe(
      takeUntil(this.destroy$),
      skip(1)
    )
    .subscribe({
    next: (pathData: { plate: string, points: Point[], position_number: number }) => {
      const startPoint: number = pathData.points[0].lat;
      const endPoint: number = pathData.points[0].long;

      this.initMap(new Point(startPoint, endPoint));

      // Rimuove il controllo del percorso precedente, se esiste
      if (this.routingControl) {
          this.map.removeControl(this.routingControl);
          this.routingControl = null;
      }

      // Crea gli waypoints basati sui punti passati
      const waypoints = pathData.points.map((point) =>
          L.latLng(point.lat, point.long)
      );

      // Sovrascrive il piano di navigazione per evitare i marker
      const customPlan = new L.Routing.Plan(waypoints, {
        createMarker: (waypointIndex, waypoint, numberOfWaypoints) => {
          let markerIcon;

          if (waypointIndex === 0) {
              // Create a divIcon for the start point
              markerIcon = L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="color: white; padding: 5px;">${this.mapService.getCustomPositionMarker(pathData.position_number.toString())}</div>`,
                  iconSize: [50, 20],
                  iconAnchor: [50, 40] // Center the icon
              });
              return L.marker(waypoint.latLng, { icon: markerIcon });
          } else if (waypointIndex === numberOfWaypoints - 1) {
              // Create a divIcon for the end point
              markerIcon = L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="color: white; padding: 5px;">${this.mapService.sessionEndMarker}</div>`,
                  iconSize: [50, 20],
                  iconAnchor: [50, 40] // Center the icon
              });
              return L.marker(waypoint.latLng, { icon: markerIcon });
          }

          // Return false for intermediate waypoints to prevent markers
          return false;
      }
      });

      this.routingControl = L.Routing.control({
          show: false,
          plan: customPlan,
          routeWhileDragging: false,
          addWaypoints: false
      }).addTo(this.map);

      this.routingControl.route();
    },
    error: error => console.error("Errore nel caricamento del percorso: ", error)
  });

  this.mapService.loadDayPath$.pipe(takeUntil(this.destroy$), skip(1))
  .subscribe({
    next: (pathData: { plate: string, points: Point[], lastPoints: Point[] }) => {
      const startPoint: number = pathData.points[0].lat;
      const endPoint: number = pathData.points[0].long;
      const isPointInPath = pathData.lastPoints.some(lastPoint => {
        return pathData.points.some(point => {
            // Compara le coordinate lat e long dei punti
            return lastPoint.lat === point.lat && lastPoint.long === point.long;
        });
    });

    if (isPointInPath) {
        console.log('Un punto di lastPoints è presente in points');
    } else {
        console.log('Nessun punto di lastPoints è presente in points');
    }

      this.initMap(new Point(startPoint, endPoint));

      // Rimuove il controllo del percorso precedente, se esiste
      if (this.routingControl) {
          this.map.removeControl(this.routingControl);
          this.routingControl = null;
      }

      // Crea gli waypoints basati sui punti passati
      const waypoints = pathData.points.map((point) =>
          L.latLng(point.lat, point.long)
      );

      let lastPointCounter = 0;

      // Sovrascrive il piano di navigazione per evitare i marker
      const customPlan = new L.Routing.Plan(waypoints, {
        createMarker: (waypointIndex, waypoint, numberOfWaypoints) => {
          const currentLastPoint = pathData.lastPoints[lastPointCounter];
          let markerIcon;

          markerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="color: white; padding: 5px;">${this.mapService.getCustomPositionMarker((lastPointCounter + 1).toString())}</div>`,
            iconSize: [50, 20],
            iconAnchor: [20, 40]
          });

          if(waypointIndex === numberOfWaypoints - 1){
            // Create a divIcon for the start point
            markerIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="color: white; padding: 5px;">${this.mapService.sessionEndMarker}</div>`,
              iconSize: [50, 20],
              iconAnchor: [20, 40]
            });
          }

          if(JSON.stringify(L.latLng(currentLastPoint.lat, currentLastPoint.long)) == JSON.stringify(waypoint.latLng)){
            lastPointCounter++;
            return L.marker(waypoint.latLng, { icon: markerIcon });
          }
          return false;
      }
      });

      this.routingControl = L.Routing.control({
          show: false,
          plan: customPlan,
          routeWhileDragging: false,
          addWaypoints: false
      }).addTo(this.map);

      this.routingControl.route();
    },
    error: error => console.error("Errore nel caricamento del path del giorno: ", error)
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
    this.map = this.mapService.initMap(this.map, point);
  }

}
