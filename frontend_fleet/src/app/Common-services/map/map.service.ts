import { Injectable, Type } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { RealtimeData } from '../../Models/RealtimeData';
import { Anomaly } from '../../Models/Anomaly';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { Point } from '../../Models/Point';

export interface positionData{
  veId: number,
  plate: string,
  cantiere: string | null,
  position: Point
}
@Injectable({
  providedIn: 'root',
})
export class MapService {
  private readonly _initMap$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private readonly _loadPosition$: BehaviorSubject<RealtimeData | null> = new BehaviorSubject<RealtimeData | null>(null);
  private readonly _loadSessionPath$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private readonly _loadDayPath$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private readonly _updateMarkers$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private readonly _selectMarker$: BehaviorSubject<positionData | null> = new BehaviorSubject<positionData | null>(null);
  private readonly _togglePopups$: Subject<void> = new Subject<void>();
  private readonly _zoomIn$: BehaviorSubject<{ point: Point; zoom: number; } | null> = new BehaviorSubject<{ point: Point; zoom: number; } | null>(null);

  positionDatas: positionData[] = [];


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
      zoom: zoom
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
   * Rimuove tutti i marker sulla mappa
   * @param map mappa da cui rimuovere i marker
   */
  removeAllMapMarkers(map: L.Map){
    const mapMarkers = this.getMapMarkers(map);

    mapMarkers.map(marker => map.removeLayer(marker));
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
   * @param point punto della mappa nel quale creare il marker
   * @param plate targa del veicolo associato
   * @param veId veId del veicolo associato
   * @param worksite cantiere del veicolo associato
   * @param anomaly anomalia
   * @returns L.marker creato
   */
  createMarker(point: Point, plate: string, worksite: string | null, veId: number, anomaly: Anomaly | undefined): L.Marker<any> {
    let positionData: positionData = {
      plate: plate,
      cantiere: worksite || null,
      veId: veId,
      position: point
    }

    let customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: this.OkMarker,
      popupAnchor: [11, 12],
    });

    if (anomaly) {
      if (anomaly.gps || anomaly.antenna || anomaly.session) {
        customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: this.errorMarker,
          popupAnchor: [11, 12],
        });
      }

      if (
        anomaly.gps &&
        !anomaly.gps.includes('totale') &&
        !anomaly.antenna &&
        !anomaly.session
      ) {
        customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: this.errorMarker,
          popupAnchor: [11, 12],
        });
      }
    }

    const marker = L.marker([point.lat, point.long], {
      icon: customIcon
    }) as L.Marker;

    marker.bindPopup(
      this.getCustomPopup(plate),
      {
        closeOnClick: false,
        autoClose: false,
        autoPan: false
      }
    );

    marker.on('add', () => {
      marker.openPopup();
    });

    marker.off('click', marker.togglePopup, marker);

    marker.on('click', (event) => {
      L.DomEvent.stop(event);

      marker.openPopup();

      this.selectMarker$.next(positionData);
    });

    if (!this.positionDatas.some(data => data.plate === positionData.plate))
      this.positionDatas.push(positionData);

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
   * Permette di ottenere tutti i marker in una mappa
   * @param map mappa di cui prendere i marker
   * @returns array di L.Marker presenti nella mappa
   */
  getMapMarkers(map: L.Map): L.Marker[]{
    const markers: L.Marker[] = [];
    map.eachLayer(layer => {
      if(layer instanceof L.Marker) markers.push(layer);
    });
    return markers;
  }

  filterMarkersByPlates(map: L.Map, plates: string[]): L.Marker[] {
    const markers: L.Marker[] = this.getMapMarkers(map);

    const plateFilteredMarkers = markers.filter(marker => {
      const markerText = this.extractMarkerPopupContent(marker);
      return markerText ? plates.includes(markerText) : false;
    });

    return plateFilteredMarkers;
  }

  extractMarkerPopupContent(marker: L.Marker): string | null{
    const popupContent = marker.getPopup()?.getContent();
    if (popupContent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = popupContent.toString();
      const textContent = tempDiv.textContent?.trim();

      if (textContent) {
        return textContent;
      }
    }
    return null;
  }


  /**
   * Mostra/nasconde i popup dei marker in una mappa
   * @param map mappa di cui togglare i popup
   */
  togglePopups(map: L.Map) {
    const markers = this.getMapMarkers(map); // Ottieni i marker direttamente

    markers.forEach(marker => {
      if (marker.isPopupOpen()) {
        marker.closePopup();
      } else {
        marker.openPopup();
      }
    });
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


  public get zoomIn$(): BehaviorSubject<{ point: Point; zoom: number; } | null> {
    return this._zoomIn$;
  }
  public get togglePopups$(): Subject<void> {
    return this._togglePopups$;
  }
  public get initMap$(): BehaviorSubject<any> {
    return this._initMap$;
  }
  public get selectMarker$(): BehaviorSubject<any> {
    return this._selectMarker$;
  }
  public get updateMarkers$(): BehaviorSubject<any> {
    return this._updateMarkers$;
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
