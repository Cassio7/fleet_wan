import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import * as L from 'leaflet';
import { MapService, pathData, positionData } from '../../Common-services/map/map.service';
import { skip, Subject, takeUntil, timestamp } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Point } from '../../Models/Point';
import { Router } from '@angular/router';
import { RealtimeData } from '../../Common-services/realtime-api/realtime-api.service';

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

  private map!: L.Map;
  private popupVisible: boolean = false;

  initialized: boolean = false;

  constructor(
    private mapService: MapService,
    private router: Router,
    private cd: ChangeDetectorRef) {}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private routingControl: L.Routing.Control | null = null;


  ngAfterViewInit(): void {
    this.handleInitMap();
    this.handleLoadPosition();
    this.handleMultipleVehiclePositionsLoading();
    this.handleLoadSessionPath();
    this.handleLoadDayPath();
    this.handleTogglePopups();
    this.handleMarkersUpdate();
    this.handleZoomIn();
    this.handleMapResizing();
  }

  /**
   * Gestisce il subject per il ridimensionamento della mappa
   */
  private handleMapResizing(){
    this.mapService.resizeMap$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        if(this.map) this.map.invalidateSize();
      },
      error: error => console.error("Errore nel ridimensionamento della mappa: ", error)
    });
  }


  /**
   * Gestisce il subject per lo zoom in sulla mappa
   */
  private handleZoomIn(){
    this.mapService.zoomIn$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (zoomData: { point: Point; zoom: number; } | null) => {
        const currentZoom = this.map.getZoom();
        if(zoomData){
          if(currentZoom < zoomData.zoom){
            this.map.flyTo([zoomData?.point.lat, zoomData?.point.long], zoomData?.zoom);
          }else{
            this.map.flyTo([zoomData?.point.lat, zoomData?.point.long], currentZoom);
          }
        }
      },
      error: error => console.error("Errore nello zoom in sulla posizione selezionata: ", error)
    });
  }

  /**
   * Gestisce la sottoscrizione all'aggiornamento dei marker presenti sulla mappa
   */
  private handleMarkersUpdate() {
    this.mapService.updateMarkers$.pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (filteredVehicles: any) => {
          const filteredPositionDatas: positionData[] = this.mapService.positionDatas.filter(data =>
            filteredVehicles.some((vehicle: any) => vehicle.plate === data.plate)
          );

          const filteredMarkers: L.Marker[] = filteredPositionDatas.map(data => {
            return this.mapService.createVehicleMarker(data.position, data.plate, data.cantiere, data.veId, undefined, data.direction, data.timestamp, data.active);
          });

          this.mapService.removeAllRelevantLayers(this.map);

          this.mapService.createMarkerClusterGroupByMarkers(filteredMarkers).addTo(this.map);
        },
        error: error => {
          console.error("Errore nell'aggiornamento dei marker presenti sulla mappa: ", error);
        }
      });
  }


  /**
   * Gestisce la sottoscrizione all'attivazione e disabilitazione dei popup dei marker
   */
  private handleTogglePopups(){
    this.mapService.togglePopups$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.popupVisible = !this.popupVisible;
        this.mapService.togglePopups(this.map, this.popupVisible);
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
  private handleMultipleVehiclePositionsLoading() {
    this.mapService.loadMultipleVehiclePositions$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (realtimeDatas: RealtimeData[]) => {
          if(this.map){
            //caricamento del layergroup con i marker dei veicoli
            const gruppoMarker: L.MarkerClusterGroup = this.mapService.createMarkerClusterGroupByRealtimeData(realtimeDatas);
            //chiusura del popup quando si preme sul cluster group
            gruppoMarker.on('clusterclick', () => {
              this.map.closePopup();
            });

            //evita che i popup nella sezione home-map si aprano quando vengono aggiunti
            gruppoMarker.eachLayer(marker => {
              if(this.router.url != "/home-mappa") {
                marker.on("add", () => {
                  marker.openPopup();
                });
              }
            });

            gruppoMarker.addTo(this.map);
          }
        },
        error: error => console.error("Errore nel caricamento di più posizioni: ", error)
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
          const marker = this.mapService.createVehicleMarker(
            point,
            realtimeData.vehicle.plate,
            realtimeData.vehicle.worksite?.name || null,
            realtimeData.vehicle.veId,
            undefined,
            realtimeData.realtime.direction,
            realtimeData.realtime.timestamp,
            realtimeData.realtime.active
          );
          if(this.router.url != "/home-mappa") {
            marker.on("add", () => {
              marker.openPopup();
            });
          }
          this.mapService.addMarker(this.map, marker);
        }
      },
      error: error => console.error("Errore nel caricamento della posizione: ", error)
    });
  }

  /**
   * Gestisce la sottoscrizione al subject per il caricamento nella mappa del percorso di un veicolo durante una sessione
   */
  private handleLoadSessionPath() {
    this.mapService.loadSessionPath$.pipe(
      takeUntil(this.destroy$),
      skip(1)
    )
    .subscribe({
      next: (pathData: pathData) => {
        console.log("Pathdata arrivati: ", pathData);
        // Filter out invalid points
        pathData.points = pathData.points.filter(point => point.lat !== 0 && point.long !== 0);

        // Get valid endpoints
        const validEndPoints = this.mapService.getFirstValidEndpoints(pathData.points);
        const startPoint: number | null = validEndPoints.startPoint;
        const endPoint: number | null = validEndPoints.endPoint;
        const pathMode = this.mapService.pathMode();

        // Initialize map if not exists
        if(!this.map && startPoint && endPoint) {
          this.initMap(new Point(startPoint, endPoint), 12)
        }else{
          this.mapService.removeAllRelevantLayers(this.map);
        };

        // Remove previous routing control if exists
        if (this.routingControl) {
          this.map.removeControl(this.routingControl);
          this.routingControl = null;
        }

        // Create waypoints from points
        const waypoints = pathData.points.map(point =>
          L.latLng(point.lat, point.long)
        );

        if (pathMode === "polyline") {
          const polyline = L.polyline(waypoints, { color: 'blue' }).addTo(this.map);

          const startMarker = L.marker(waypoints[0], {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="color: white; padding: 5px;">${this.mapService.getCustomPositionMarker(String(pathData.position_number) || '')}</div>`,
              iconSize: [50, 20],
              iconAnchor: [50, 40]
            })
          }).addTo(this.map);

          const endMarker = L.marker(waypoints[waypoints.length - 1], {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="color: white; padding: 5px;">${this.mapService.sessionEndMarker}</div>`,
              iconSize: [50, 20],
              iconAnchor: [50, 40]
            })
          }).addTo(this.map);

          console.log("pathData.tagPoints: ", pathData.tagPoints);
          if(pathData.tagPoints) this.mapService.createMarkerGroup(pathData.tagPoints, this.mapService.tagMarker).addTo(this.map);

          this.map.fitBounds(polyline.getBounds());
        } else if (pathMode === "routed") {
          // Create custom plan with markers
          const customPlan = new L.Routing.Plan(waypoints, {
            createMarker: (waypointIndex, waypoint, numberOfWaypoints) => {
              let markerIcon;

              if (waypointIndex === 0) {
                markerIcon = L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="color: white; padding: 5px;">${this.mapService.getCustomPositionMarker(String(pathData.position_number) || '')}</div>`,
                  iconSize: [50, 20],
                  iconAnchor: [50, 40]
                });
                return L.marker(waypoint.latLng, { icon: markerIcon });
              } else if (waypointIndex === numberOfWaypoints - 1) {
                markerIcon = L.divIcon({
                  className: 'custom-div-icon',
                  html: `<div style="color: white; padding: 5px;">${this.mapService.sessionEndMarker}</div>`,
                  iconSize: [50, 20],
                  iconAnchor: [50, 40]
                });
                return L.marker(waypoint.latLng, { icon: markerIcon });
              }

              return false;
            }
          });

          this.mapService.pathType.set("session");

          this.routingControl = this.mapService.createCustomPlaneRoutingControl(this.map, customPlan);

          this.routingControl.route();
        }
      },
      error: error => console.error("Errore nel caricamento del percorso: ", error)
    });
  }

  /**
   * Gestisce la sottoscrizione al subject per il caricamento nella mappa del percorso di un veicolo durante una giornata
   * mettendo insieme i percorsi effettauti durante le sessioni della giornata
   */
  private handleLoadDayPath() {
    this.mapService.loadDayPath$.pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (pathData: pathData) => {
          console.log("load day path arrivato! Questi so i path data: ", pathData);
          console.log("pathMode: ", this.mapService.pathMode());
          pathData.points = pathData.points.filter(point => point.lat !== 0 && point.long !== 0);
          if(pathData.firstPoints) pathData.firstPoints = pathData.firstPoints.filter(point => point.lat !== 0 && point.long !== 0);

          const validEndPoints = this.mapService.getFirstValidEndpoints(pathData.points);
          const startPoint: number | null = validEndPoints.startPoint;
          const endPoint: number | null = validEndPoints.endPoint;
          const pathMode = this.mapService.pathMode();

          if(!this.map && startPoint && endPoint) {
            this.initMap(new Point(startPoint, endPoint), 12)
          }else{
            this.mapService.removeAllRelevantLayers(this.map);
          };

          if (this.routingControl) {
            this.map.removeControl(this.routingControl);
            this.routingControl = null;
          }

          const waypoints = pathData.points.map(point => L.latLng(point.lat, point.long));

          if (pathMode === "polyline") {
            const polyline = L.polyline(waypoints, { color: 'blue' }).addTo(this.map);

            if(pathData.firstPoints) this.mapService.createCustomPathVehicleMarkers(pathData.points, pathData.firstPoints).addTo(this.map);
            console.log("pathData.tagPoints: ", pathData.tagPoints);
            if(pathData.tagPoints) this.mapService.createMarkerGroup(pathData.tagPoints, this.mapService.tagMarker).addTo(this.map);
            this.map.fitBounds(polyline.getBounds());
          } else if (pathMode === "routed") {
            let customPlan;
            if (pathData.firstPoints) {
                customPlan = this.mapService.createVehicleCustomRoutingPlan(pathData.points, pathData.firstPoints);
            }

            this.mapService.pathType.set("day");

            if(customPlan) {
              this.routingControl = this.mapService.createCustomPlaneRoutingControl(this.map, customPlan);
              this.routingControl.on('routesfound', (e) => {
                const route = e.routes[0];
                if (route) {
                    const bounds = L.latLngBounds(route.coordinates);
                    this.map.fitBounds(bounds);
                    setTimeout(() => {
                        this.map.invalidateSize();
                    }, 100);
                }
              });
            }
        }

        },
        error: error => console.error("Errore nel caricamento del path del giorno: ", error)
      });
  }

  /**
   * Inizializza la mappa su un punto
   * @param point punto da cui inizializzare la mappa
   * @param zoom zoom con la quale impostare la vista
   */
  private initMap(point: Point, zoom: number) {
    this.initialized = true;
    this.cd.detectChanges();
    if(this.map) this.mapService.removeMap(this.map);
    this.map = this.mapService.initMap(this.map, point, zoom);
  }

}
