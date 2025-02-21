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
import { MapService, positionData } from '../../Common-services/map/map.service';
import { skip, Subject, takeUntil, filter, take } from 'rxjs';
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
    this.handleInitMap();
    this.handleLoadPosition();
    this.handleLoadSessionPath();
    this.handleLoadDayPath();
    this.handleTogglePopups();
    this.handleMarkersUpdate();
    this.handleZoomIn();
  }

  private handleZoomIn(){
    this.mapService.zoomIn$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (zoomData: { point: Point; zoom: number; } | null) => {
        if(zoomData){
          this.map.flyTo([zoomData?.point.lat, zoomData?.point.long], zoomData?.zoom);
        }
      },
      error: error => console.error("Errore nello zoom in sulla posizione selezionata: ", error)
    });
  }

  /**
   * Gestisce la sottoscrizione all'aggiornamento dei marker presenti sulla mappa
   */
  private handleMarkersUpdate(){
    this.mapService.updateMarkers$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (filteredVehicles: any) => {
        const filteredPositionDatas: positionData[] = this.mapService.positionDatas.filter(data =>
          filteredVehicles.some((vehicle: any) => vehicle.plate === data.plate)
        );
        const filteredMarkers: L.Marker[] = filteredPositionDatas.map(data => {
          return this.mapService.createMarker(data.position, data.plate, data.veId, undefined);
        });

        this.mapService.removeAllMapMarkers(this.map);
        filteredMarkers.forEach(marker => {
          this.mapService.addMarker(this.map, marker);
        });
      },
      error: error => console.error("Errore nell'aggiornamento dei marker presenti sulla mappa: ", error)
    });
  }

  /**
   * Gestisce la sottoscrizione all'attivazione e disabilitazione dei popup dei marker
   */
  private handleTogglePopups(){
    this.mapService.togglePopups$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.mapService.togglePopups(this.map);
      },
      error: error => console.error("Errore nel toggle dei popup nei marker: ", error)
    });
  }

  /**
   * Gestisce la sottoscrizione al subject per l'inizializzazione della mappa in un punto
   */
  private handleInitMap(){
    this.mapService.initMap$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (initData: {point: Point, zoom: number}) => {
        this.initMap(initData.point, initData.zoom || 12);
      },
      error: error => console.error("Errore nell'inizializzazione della mappa: ", error)
    });
  }

  /**
   * Gestisce la sottoscrizione al subject per il caricamento nella mappa di una posizione
   */
  private handleLoadPosition(){
    this.mapService.loadPosition$.pipe(takeUntil(this.destroy$), skip(1)).subscribe({
      next: (realtimeData: RealtimeData | null) => {
        if (realtimeData && realtimeData.realtime) {
          const point = new Point(realtimeData.realtime.latitude, realtimeData.realtime.longitude);
          const marker = this.mapService.createMarker(
            point,
            realtimeData.vehicle.plate,
            realtimeData.vehicle.veId,
            undefined
          );
          this.mapService.addMarker(this.map, marker);
        }
      },
    });
  }

  /**
   * Gestisce la sottoscrizione al subject per il caricamento nella mappa del percorso di un veicolo durante una sessione
   */
  private handleLoadSessionPath(){
    this.mapService.loadSessionPath$.pipe(
      takeUntil(this.destroy$),
      skip(1)
    )
    .subscribe({
    next: (pathData: { plate: string, points: Point[], position_number: number }) => {
      pathData.points = pathData.points.filter(point => point.lat != 0 && point.long != 0); //rimozione di punti non validi

      const validEndPoints = this.mapService.getFirstValidEndpoints(pathData.points);
      let startPoint: number | null = validEndPoints.startPoint;
      let endPoint: number | null = validEndPoints.endPoint;

      if (startPoint === null || endPoint === null) {
        console.log("Nessun punto valido trovato.");
      } else {
        this.initMap(new Point(startPoint, endPoint),12);
      }

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
  }

  /**
   * Gestisce la sottoscrizione al subject per il caricamento nella mappa del percorso di un veicolo durante l'insieme di tutte le sessioni di un veicolo
   */
  private handleLoadDayPath(){
    this.mapService.loadDayPath$.pipe(takeUntil(this.destroy$), skip(1))
  .subscribe({
    next: (pathData: { plate: string, points: Point[], firstPoints: Point[] }) => {
      //rimozione di punti non validi
      pathData.points = pathData.points.filter(point => point.lat != 0 && point.long != 0);
      pathData.firstPoints = pathData.firstPoints.filter(point => point.lat != 0 && point.long != 0);

      const validEndPoints = this.mapService.getFirstValidEndpoints(pathData.points);
      let startPoint: number | null = validEndPoints.startPoint;
      let endPoint: number | null = validEndPoints.endPoint;

      if (startPoint === null || endPoint === null) {
        console.log("Nessun punto valido trovato.");
      } else {
        this.initMap(new Point(startPoint, endPoint),12);
      }

      // Rimuove il controllo del percorso precedente, se esiste
      if (this.routingControl) {
          this.map.removeControl(this.routingControl);
          this.routingControl = null;
      }

      // Crea gli waypoints basati sui punti passati
      const waypoints = pathData.points.map((point) =>
          L.latLng(point.lat, point.long)
      );

      let firstPointCounter = 0;

      // Sovrascrive il piano di navigazione per evitare i marker
      const customPlan = new L.Routing.Plan(waypoints, {
        createMarker: (waypointIndex, waypoint, numberOfWaypoints) => {
          const currentFirstPosition = pathData.firstPoints[firstPointCounter];
          let markerIcon;

          markerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="color: white; padding: 5px;">${this.mapService.getCustomPositionMarker((firstPointCounter + 1).toString())}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10,10]
          });

          if(waypointIndex === waypoints.length - 1){
            // Create a divIcon for the start point
            markerIcon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="color: white; padding: 5px;">${this.mapService.sessionEndMarker}</div>`,
              iconSize: [50, 20],
              iconAnchor: [10,10]
            });
          }

          if((currentFirstPosition && JSON.stringify(L.latLng(currentFirstPosition.lat, currentFirstPosition.long)) == JSON.stringify(waypoint.latLng)) ||
          waypointIndex === waypoints.length - 1){
            firstPointCounter++;
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
  private initMap(point: Point, zoom: number) {
    this.initialized = true;
    this.cd.detectChanges();
    if(this.map) this.mapService.removeMap(this.map);
    this.map = this.mapService.initMap(this.map, point, zoom);
  }

}
