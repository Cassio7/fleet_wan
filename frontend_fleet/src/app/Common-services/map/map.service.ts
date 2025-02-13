import { Injectable } from '@angular/core';
import L from 'leaflet';
import { BehaviorSubject, map, Subject } from 'rxjs';
import { RealtimeData } from '../../Models/RealtimeData';
import { Anomaly } from '../../Models/Anomaly';

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private readonly _loadMap$: BehaviorSubject<RealtimeData | null> =
    new BehaviorSubject<RealtimeData | null>(null);

  constructor() {}

  /**
   * Inizializza una mappa
   * @param lat latitudine
   * @param long longitudine
   */
  initMap(map: L.Map, lat: number, long: number): L.Map {
    map = L.map('map', {
      center: [lat, long],
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
      html: `<svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          </svg>
`,
      popupAnchor: [11, -6],
    });
    if (anomaly) {
      if (anomaly.gps || anomaly.antenna || anomaly.session)
        customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          </svg>
      `,
          popupAnchor: [11, -6],
        });

      if (
        anomaly.gps &&
        !anomaly.gps.includes('totale') &&
        !anomaly.antenna &&
        !anomaly.session
      )
        customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_206_1349)">
        <circle cx="16.8809" cy="12.4832" r="12" fill="#C5D026"/>
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
        </svg>
    `,
          popupAnchor: [11, -6],
        });
    }

    const marker = L.marker([lat, long], { icon: customIcon }); //creazione del marker
    marker.bindPopup(msg, { autoClose: true });

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

  public get loadMap$(): BehaviorSubject<RealtimeData | null> {
    return this._loadMap$;
  }
}
