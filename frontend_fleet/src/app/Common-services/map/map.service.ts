import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RealtimeData } from '../../Models/RealtimeData';
import { Anomaly } from '../../Models/Anomaly';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Point } from '../../Models/Point';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private readonly _loadMap$: BehaviorSubject<RealtimeData | null> = new BehaviorSubject<RealtimeData | null>(null);
  private readonly _loadPath$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  OkMarker = `<svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_d_206_1354)">
          <circle cx="16.8809" cy="12.0039" r="12" fill="#5C9074"/>
          <circle cx="16.8809" cy="12.0039" r="11" stroke="white" stroke-width="2"/>
          </g>
          <defs>
          <filter id="filter0_d_206_1354" x="0.880859" y="0.00390625" width="32" height="32" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="4"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_206_1354"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_206_1354" result="shape"/>
          </filter>
          </defs>
          </svg>`;

  errorMarker = `<svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_d_206_1349)">
          <circle cx="16.8809" cy="12.4832" r="12" fill="#D02626"/>
          <circle cx="16.8809" cy="12.4832" r="11" stroke="white" stroke-width="2"/>
          </g>
          <defs>
          <filter id="filter0_d_206_1349" x="0.880859" y="0.483154" width="32" height="32" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="4"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_206_1349"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_206_1349" result="shape"/>
          </filter>
          </defs>
          </svg>`;
  sessionEndMarker = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" viewBox="0 0 32 32" xml:space="preserve">
          <polyline style="fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:10;" points="6,28 6,5 26,5 26,19 6,19 "/>
          <rect x="22" y="5" width="4" height="4"/>
          <rect x="19" y="15" width="3" height="4"/>
          <rect x="19" y="9" width="3" height="3"/>
          <rect x="13" y="15" width="3" height="4"/>
          <rect x="13" y="9" width="3" height="3"/>
          <rect x="6" y="15" width="4" height="4"/>
          <rect x="6" y="9" width="4" height="3"/>
          <rect x="22" y="12" width="4" height="3"/>
          <rect x="16" y="12" width="3" height="3"/>
          <rect x="10" y="12" width="3" height="3"/>
          <rect x="16" y="5" width="3" height="4"/>
          <rect x="10" y="5" width="3" height="4"/>
          </svg>`;

  constructor() {}

  /**
   * Inizializza una mappa tramite un punto
   * @param lat latitudine
   * @param long longitudine
   */
  initMapByPoint(map: L.Map, point: Point): L.Map {
    map = L.map('map', {
      center: [point.lat, point.long],
      zoom: 12,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    tiles.addTo(map);
    return map;
  }


  /**
   * Crea un percorso su una mappa data un array di coordinate.
   * @param map Istanza della mappa Leaflet
   * @param waypoints Array di Point
   */
  addRoute(map: L.Map, waypoints: L.LatLng[]) {
    // Add OpenStreetMap tile layer to the map
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create the routing control
    L.Routing.control({
      router: L.Routing.osrmv1({
        serviceUrl: `http://router.project-osrm.org/route/v1/`
      }),
      showAlternatives: true,
      lineOptions: {
        styles: [{ color: '#242c81', weight: 7 }],
        extendToWaypoints: true,  // This property makes sure the route extends to the waypoints
        missingRouteTolerance: 200  // Adjust this tolerance as needed
      },
      fitSelectedRoutes: false,
      altLineOptions: {
        styles: [{ color: '#ed6852', weight: 7 }],
        extendToWaypoints: true,  // Ensure alternative routes also extend to waypoints
        missingRouteTolerance: 200  // Adjust this tolerance as needed
      },
      show: false,
      routeWhileDragging: true,
      waypoints: waypoints // Use the waypoints passed as parameter
    }).addTo(map);

    return map;
  }

  /**
   * rimuove una mappa, se esiste
   * @param map mappa da rimuovere
   */
  removeMap(map: L.Map) {
    if (map) {
      map.remove();
    }
  }

  /**
   * Aggiunge un marker alla mappa
   * @param marker marker da aggiugere
   */
  addMarker(map: L.Map, marker: L.Marker<any>) {
    marker.addTo(map);
  }

  /**
   * Permette di creare un marker di Lea Flet
   * @param lat latitudine della posizione
   * @param long longitudine della posizione
   * @param msg contenuto del messaggio che appare onMouseOver
   * @returns marker Lea Flet
   */
  createMarker(
    lat: number,
    long: number,
    msg: string,
    anomaly: Anomaly | undefined
  ): L.Marker<any> {
    let customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: this.OkMarker,
      popupAnchor: [11, 12],
    });
    if (anomaly) {
      if (anomaly.gps || anomaly.antenna || anomaly.session)
        customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: this.errorMarker,
          popupAnchor: [11, 12],
        });

      if (
        anomaly.gps &&
        !anomaly.gps.includes('totale') &&
        !anomaly.antenna &&
        !anomaly.session
      )
        customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: this.errorMarker,
          popupAnchor: [11, 12],
        });
    }

    const marker = L.marker([lat, long], { icon: customIcon }); //creazione del marker
    marker.bindPopup(
      this.getCustomPopup(msg),
      {
        autoClose: false,
      }
    );

    // Apre il popup solo quando si passa sopra al marker
    marker.on('add', () => {
      marker.openPopup();
    });

    // Apre il popup solo quando si passa sopra al marker
    marker.on('mouseover', () => {
      marker.openPopup();
    });

    // Chiude il popup quando il mouse esce dal marker
    marker.on('mouseout', () => {
      marker.closePopup();
    });

    return marker;
  }

  /**
   * Permette di ottenere la stringa svg del popup custom
   * @param msg messaggio all'interno del popup
   * @returns stringa contenente l'elemento svg
   */
  getCustomPopup(msg: string): string{
    return `
    <div class="custom-popup">
      <span class="popup-text">${msg}</span>
      <div class="popup-arrow"></div>
    </div>
    `
  }


  public get loadMap$(): BehaviorSubject<RealtimeData | null> {
    return this._loadMap$;
  }
  public get loadPath$(): BehaviorSubject<any> {
    return this._loadPath$;
  }
}
