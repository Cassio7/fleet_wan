import { Injectable, Type } from '@angular/core';
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
  private readonly _initMap$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private readonly _loadPosition$: BehaviorSubject<RealtimeData | null> = new BehaviorSubject<RealtimeData | null>(null);
  private readonly _loadSessionPath$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private readonly _loadDayPath$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

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
  initMap(map: L.Map, point: Point, zoom: number): L.Map {
    map = L.map('map', {
      center: [point.lat, point.long],
      zoom: zoom,
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
        autoPan: false
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
   * Permette di ottenere i primi punti validi (con latitudine e longitudine diversi da 0) di inizio e di fine di una serie di punti
   * @param points array di punti
   * @returns
   */
  getFirstValidEndpoints(points: Point[]){
    let startPoint: number | null = null;
    let endPoint: number | null = null;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (point.lat !== 0 && point.long !== 0) {
        startPoint = point.lat;
        endPoint = point.long;
        break;
      }
    }
    return {
      startPoint: startPoint,
      endPoint: endPoint
    }
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

  /**
   * Permette di ottenere la stringa svg del marker per una posizione diversa dalla posizione di fine percorso
   * @param msg messaggio all'interno del popup
   * @returns stringa contenente l'elemento svg
   */
  getCustomPositionMarker(msg: string): string{
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 50" width="60" height="50">
            <!-- Forma del pin GPS -->
            <path d="M30,3 C22,3 17,18 17,25 C17,32 30,45 30,45 C30,45 43,32 43,25 C43,18 38,3 30,3 Z" fill="#2196F3" stroke="#1976D2" stroke-width="2"/>
            <!-- Numero bianco al centro della testa -->
            <text x="50%" y="40%" font-size="12" text-anchor="middle" fill="#FFFFFF" dy=".3em">${msg}</text>
          </svg>
    `;
  }


  public get initMap$(): BehaviorSubject<any> {
    return this._initMap$;
  }
  public get loadDayPath$(): BehaviorSubject<any> {
    return this._loadDayPath$;
  }
  public get loadPosition$(): BehaviorSubject<RealtimeData | null> {
    return this._loadPosition$;
  }
  public get loadSessionPath$(): BehaviorSubject<any> {
    return this._loadSessionPath$;
  }
}
