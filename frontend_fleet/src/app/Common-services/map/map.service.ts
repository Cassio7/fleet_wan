import { Injectable, signal } from '@angular/core';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet.markercluster';
import 'leaflet-rotatedmarker';
import { BehaviorSubject, Observable, Subject, map, range } from 'rxjs';
import { Anomaly } from '../../Models/Anomaly';
import { Point } from '../../Models/Point';
import { RealtimeData } from '../realtime-api/realtime-api.service';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Session } from '../../Models/Session';
import { serverUrl } from '../../environment';
import { VehicleRangeKm } from '@interfaces2/VehicleRangeKm.interface';


export interface positionData {
  veId: number;
  plate: string;
  cantiere: string | null;
  position: Point;
  direction: number;
  timestamp: string;
  active: boolean;
}

export interface pathData {
  plate: string;
  points: Point[];
  position_number?: number;
  firstPoints?: Point[];
  tagPoints?: Point[];
}

@Injectable({
  providedIn: 'root',
})
export class MapService {
  defaultPoint: Point = new Point(41.902782, 12.496366);
  defaultZoom: number = 5;

  private readonly _initMap$: BehaviorSubject<{ point: Point; zoom: number }> =
    new BehaviorSubject<{ point: Point; zoom: number }>({
      point: this.defaultPoint,
      zoom: this.defaultZoom,
    });
  private readonly _loadLayerGroup$: BehaviorSubject<L.LayerGroup | null> = new BehaviorSubject<L.LayerGroup | null>(null);
  private readonly _loadMultipleVehiclePositions$: BehaviorSubject<
    RealtimeData[]
  > = new BehaviorSubject<RealtimeData[]>([]);
  private readonly _loadPosition$: BehaviorSubject<RealtimeData | null> =
    new BehaviorSubject<RealtimeData | null>(null);
  private readonly _loadSessionPath$: BehaviorSubject<any> =
    new BehaviorSubject<any>(null);
  private readonly _loadDayPath$: BehaviorSubject<any> =
    new BehaviorSubject<any>(null);
  private readonly _updateMarkers$: BehaviorSubject<any> =
    new BehaviorSubject<any>(null);

  private readonly _removeMarkers$: BehaviorSubject<{ type: string; } | null> = new BehaviorSubject<{ type: string; } | null>(null); //rimuove tutti i marker se passato "null", altrimenti rimuove solo quelli con l'attributo "type" specificato

  private readonly _selectMarker$: BehaviorSubject<positionData | null> =
    new BehaviorSubject<positionData | null>(null);
  private readonly _togglePopups$: Subject<boolean> = new Subject<boolean>();
  private readonly _zoomIn$: BehaviorSubject<{
    point: Point;
    zoom: number;
  } | null> = new BehaviorSubject<{ point: Point; zoom: number } | null>(null);

  private readonly _resizeMap$: Subject<void> = new Subject<void>();

  pathMode = signal('polyline');
  pathType = signal('day');

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
  warningMarker = `<svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_d_122_1748)">
          <circle cx="16.8809" cy="12.0039" r="12" fill="#C5D026"/>
          <circle cx="16.8809" cy="12.0039" r="11" stroke="white" stroke-width="2"/>
          </g>
          <defs>
          <filter id="filter0_d_122_1748" x="0.880859" y="0.00390625" width="32" height="32" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="4"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_122_1748"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_122_1748" result="shape"/>
          </filter>
          </defs>
          </svg>
`;
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
  tagMarker = `<svg class="tag-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M10 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

  movingMarkerGreen = `<svg width="33" height="36" viewBox="0 0 33 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_64_659)">
        <path d="M28.6531 24.3066C28.6531 30.9341 23.2805 24.3066 16.6531 24.3066C10.0257 24.3066 4.65308 30.9341 4.65308 24.3066C4.65308 17.6792 10.0257 0.5 16.6531 0.5C23.2805 0.5 28.6531 17.6792 28.6531 24.3066Z" fill="#5C9074"/>
        <path d="M27.6531 24.3066C27.6531 25.0829 27.5723 25.5761 27.4663 25.8767C27.3683 26.1542 27.2747 26.202 27.2551 26.2121L27.2546 26.2123C27.2107 26.2348 27.0773 26.279 26.7521 26.2302C26.4287 26.1816 26.0176 26.0571 25.4948 25.8576C25.0601 25.6918 24.5906 25.4912 24.0676 25.2678C23.9652 25.224 23.8608 25.1794 23.7541 25.134C23.1129 24.861 22.4091 24.5669 21.6633 24.2979C20.1742 23.7609 18.4726 23.3066 16.6531 23.3066C14.8336 23.3066 13.132 23.7609 11.6429 24.2979C10.897 24.5669 10.1933 24.861 9.552 25.134C9.44539 25.1794 9.34098 25.224 9.23861 25.2678C8.7156 25.4912 8.24611 25.6918 7.81136 25.8576C7.28853 26.0571 6.8775 26.1816 6.55409 26.2302C6.22885 26.279 6.09544 26.2348 6.05155 26.2123L6.05106 26.2121C6.03141 26.202 5.93782 26.1542 5.8399 25.8767C5.73382 25.5761 5.65308 25.0829 5.65308 24.3066C5.65308 21.1694 6.94971 15.3542 9.0885 10.3083C10.1544 7.79354 11.4015 5.53848 12.7488 3.9299C14.1182 2.29487 15.442 1.5 16.6531 1.5C17.8641 1.5 19.188 2.29487 20.5574 3.9299C21.9047 5.53848 23.1517 7.79354 24.2177 10.3083C26.3564 15.3542 27.6531 21.1694 27.6531 24.3066Z" stroke="white" stroke-width="2"/>
        </g>
        <defs>
        <filter id="filter0_d_64_659" x="0.653076" y="0.5" width="32" height="34.7522" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_64_659"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_64_659" result="shape"/>
        </filter>
        </defs>
        </svg>
        `;
  movingMarkerRed = `<svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_122_1745)">
        <path d="M28.3923 22.0039C28.3923 28.6313 23.0198 22.0039 16.3923 22.0039C9.76492 22.0039 4.39233 28.6313 4.39233 22.0039C4.39233 15.3765 9.76492 0 16.3923 0C23.0198 0 28.3923 15.3765 28.3923 22.0039Z" fill="#D02626"/>
        <path d="M27.3923 22.0039C27.3923 22.7802 27.3116 23.2733 27.2055 23.574C27.1076 23.8515 27.014 23.8993 26.9944 23.9094L26.9939 23.9096C26.95 23.9321 26.8166 23.9762 26.4913 23.9274C26.1679 23.8789 25.7569 23.7543 25.234 23.5549C24.7993 23.389 24.3298 23.1885 23.8068 22.9651C23.7045 22.9213 23.6 22.8767 23.4934 22.8313C22.8521 22.5583 22.1484 22.2642 21.4025 21.9952C19.9134 21.4582 18.2119 21.0039 16.3923 21.0039C14.5728 21.0039 12.8713 21.4582 11.3821 21.9952C10.6363 22.2642 9.93255 22.5583 9.29126 22.8313C9.18465 22.8767 9.08024 22.9213 8.97787 22.965C8.45486 23.1885 7.98537 23.389 7.55062 23.5549C7.02779 23.7543 6.61675 23.8789 6.29335 23.9274C5.96811 23.9762 5.83469 23.9321 5.79081 23.9096L5.79031 23.9094C5.77067 23.8993 5.67708 23.8515 5.57915 23.574C5.47307 23.2733 5.39233 22.7802 5.39233 22.0039C5.39233 18.8774 6.68332 13.5225 8.8139 8.93814C9.87525 6.65444 11.1157 4.62711 12.454 3.18682C13.8052 1.73263 15.1369 1 16.3923 1C17.6478 1 18.9795 1.73263 20.3307 3.18682C21.669 4.62711 22.9094 6.65444 23.9708 8.93814C26.1013 13.5225 27.3923 18.8774 27.3923 22.0039Z" stroke="white" stroke-width="2"/>
        </g>
        <defs>
        <filter id="filter0_d_122_1745" x="0.392334" y="0" width="32" height="32.9495" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_122_1745"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_122_1745" result="shape"/>
        </filter>
        </defs>
        </svg>
`;
  movingMarkerYellow = `<svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_122_1745)">
        <path d="M28.3923 22.0039C28.3923 28.6313 23.0198 22.0039 16.3923 22.0039C9.76492 22.0039 4.39233 28.6313 4.39233 22.0039C4.39233 15.3765 9.76492 0 16.3923 0C23.0198 0 28.3923 15.3765 28.3923 22.0039Z" fill="#C5D026"/>
        <path d="M27.3923 22.0039C27.3923 22.7802 27.3116 23.2733 27.2055 23.574C27.1076 23.8515 27.014 23.8993 26.9944 23.9094L26.9939 23.9096C26.95 23.9321 26.8166 23.9762 26.4913 23.9274C26.1679 23.8789 25.7569 23.7543 25.234 23.5549C24.7993 23.389 24.3298 23.1885 23.8068 22.9651C23.7045 22.9213 23.6 22.8767 23.4934 22.8313C22.8521 22.5583 22.1484 22.2642 21.4025 21.9952C19.9134 21.4582 18.2119 21.0039 16.3923 21.0039C14.5728 21.0039 12.8713 21.4582 11.3821 21.9952C10.6363 22.2642 9.93255 22.5583 9.29126 22.8313C9.18465 22.8767 9.08024 22.9213 8.97787 22.965C8.45486 23.1885 7.98537 23.389 7.55062 23.5549C7.02779 23.7543 6.61675 23.8789 6.29335 23.9274C5.96811 23.9762 5.83469 23.9321 5.79081 23.9096L5.79031 23.9094C5.77067 23.8993 5.67708 23.8515 5.57915 23.574C5.47307 23.2733 5.39233 22.7802 5.39233 22.0039C5.39233 18.8774 6.68332 13.5225 8.8139 8.93814C9.87525 6.65444 11.1157 4.62711 12.454 3.18682C13.8052 1.73263 15.1369 1 16.3923 1C17.6478 1 18.9795 1.73263 20.3307 3.18682C21.669 4.62711 22.9094 6.65444 23.9708 8.93814C26.1013 13.5225 27.3923 18.8774 27.3923 22.0039Z" stroke="white" stroke-width="2"/>
        </g>
        <defs>
        <filter id="filter0_d_122_1745" x="0.392334" y="0" width="32" height="32.9495" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dy="4"/>
        <feGaussianBlur stdDeviation="2"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_122_1745"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_122_1745" result="shape"/>
        </filter>
        </defs>
        </svg>
`;
  vehiclePointResearchMarker = `<svg xmlns="http://www.w3.org/2000/svg" height="48" width="48" viewBox="0 0 48 48" fill="currentColor">
        <path d="M4 11v26h4.3q.85 2.05 2.625 3.275Q12.7 42.5 15 42.5q2.3 0 4.075-1.225T21.7 37H26.3q.85 2.05 2.625 3.275Q31.7 41.5 34 41.5q2.3 0 4.075-1.225T40.7 37H44V22.15L37.9 14H30v-3Zm26 17V18h6.35l4.5 6.15V28Zm-15 9q-1.45 0-2.475-1.025Q11.5 34.95 11.5 33.5q0-1.45 1.025-2.475Q13.55 30 15 30q1.45 0 2.475 1.025Q18.5 32.05 18.5 33.5q0 1.45-1.025 2.475Q16.45 37 15 37Zm19 0q-1.45 0-2.475-1.025Q30.5 34.95 30.5 33.5q0-1.45 1.025-2.475Q32.55 30 34 30q1.45 0 2.475 1.025Q37.5 32.05 37.5 33.5q0 1.45-1.025 2.475Q35.45 37 34 37Z"/>
        </svg>
        `;

  constructor(
    private sessionStorageService: SessionStorageService,
    private cookieService: CookieService,
    private http: HttpClient
  ) {}

  /**
   * Crea e ritorna una legenda
   * @param title Titolo della legenda
   * @param subtitle Sottotitolo della legenda
   * @param values Oggetto contenente chiave: valore, dove ogni valore è un oggetto con una chiave 'icon' (SVG) e 'description' (descrizione)
   * @returns L.Control La legenda
   */
  createLegend(title: string, subtitle: string, values: { [key: string]: { icon: string, description: string } }): L.Control {
    const legend = new L.Control({ position: 'topright' });

    legend.onAdd = (map: L.Map) => {
      const div = L.DomUtil.create('div', 'info legend');
      div.style.backgroundColor = 'white';
      div.style.padding = '6px';
      div.style.border = '1px solid #ccc';
      div.style.borderRadius = '5px';

      //creazione dell'header
      const header = document.createElement('div');
      header.innerHTML = `<div class='legend-header'><strong class='title'>${title} ▼</strong><br><span class='subtitle'>${subtitle}</span></div>`;
      header.style.cursor = 'pointer';
      header.style.marginBottom = "0px";

      //creazione del contenuto
      const content = document.createElement('div');
      content.style.display = 'none'; // legenda chiusa inizialmente
      content.style.marginTop = '5px';

      //valori nel contenuto della legend
      Object.keys(values).forEach(key => {
        const value = values[key];
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';

        //icona a sinistra
        const icon = document.createElement('span');
        icon.innerHTML = value.icon;  // SVG come stringa
        row.appendChild(icon);

        //descrizione icona
        const description = document.createElement('span');
        description.style.marginLeft = '5px';
        description.textContent = value.description;
        row.appendChild(description);

        content.appendChild(row); //aggiunta dell'oggetto al div contenuto
      });

      //aggiunta di header e contenuto al div princpale
      div.appendChild(header);
      div.appendChild(content);

      //aggiunta funzionalità di apertura e chiusura
      let isOpen = false;
      header.addEventListener('click', function() {
        if (isOpen) {
          content.style.display = 'none';
          header.innerHTML = `<div class='legend-header'><strong class='title'>${title} ▶</strong><br><span class='subtitle'>${subtitle}</span></div>`;
          isOpen = false;
        } else {
          content.style.display = 'block';
          header.innerHTML = `<div class='legend-header'><strong class='title'>${title} ▼</strong><br><span class='subtitle'>${subtitle}</span></div>`;
          isOpen = true;
        }
      });

      return div;
    };

    return legend;
  }

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
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    tiles.addTo(map);

    //dati della legend
    const legendData = {
      title: 'Legenda',
      subtitle: 'Ultima trasmissione GPS',
      values: {
        moving: {
          icon: this.movingMarkerGreen,
          description: 'in movimento',
        },
        ok: {
          icon: this.OkMarker,
          description: 'entro 30 minuti',
        },
        warning: {
          icon: this.warningMarker,
          description: 'tra 30 minuti e 12 ore',
        },
        error: {
          icon: this.errorMarker,
          description: 'oltre 12 ore',
        },
      },
    };

    //creazione e aggiunta della legenda alla mappa
    const legend = this.createLegend(legendData.title, legendData.subtitle, legendData.values);
    legend.addTo(map);

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
  removeAllMapMarkers(map: L.Map) {
    const mapMarkers = this.getMapMarkers(map);

    mapMarkers.map((marker) => {
      if (marker) map.removeLayer(marker);
    });
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
  createVehicleMarker(
  point: Point,
  plate: string,
  worksite: string | null,
  veId: number,
  anomaly: Anomaly | undefined,
  direction: number,
  timestamp: string,
  active: boolean
): L.Marker<any> {
  let positionData: positionData = {
    plate: plate,
    cantiere: worksite || null,
    veId: veId,
    position: point,
    direction: direction,
    timestamp: timestamp,
    active: active,
  };

  let customIcon = L.divIcon({
    className: 'ok-icon',
    html: false,
    popupAnchor: [11, 12],
  });

  const now = new Date();
  const inputDate = new Date(timestamp);

  // Calcola la differenza in millisecondi (in UTC)
  const diffInMs = now.getTime() - inputDate.getTime();

  // Convertiamo la differenza in minuti e ore
  const diffInMinutes = diffInMs / (1000 * 60); // Differenza in minuti
  const diffInHours = diffInMs / (1000 * 60 * 60); // Differenza in ore

  // Verifica la condizione della differenza temporale
  if (diffInMinutes <= 30) {
    if (active) {
      customIcon = L.divIcon({
        className: 'ok-icon',
        html: this.movingMarkerGreen,
        popupAnchor: [11, 12],
      });
    } else {
      customIcon = L.divIcon({
        className: 'ok-icon',
        html: this.OkMarker,
        popupAnchor: [11, 12],
      });
      direction = 0
    }
  } else if (diffInHours <= 12) {
    customIcon = L.divIcon({
      className: 'ok-icon',
      html: this.warningMarker,
      popupAnchor: [11, 12],
    });
    direction = 0
  } else {
    customIcon = L.divIcon({
      className: 'ok-icon',
      html: this.errorMarker,
      popupAnchor: [11, 12],
    });
    direction = 0
  }

  const marker = L.marker([point.lat, point.long], {
    icon: customIcon,
    rotationAngle: direction,
  }) as L.Marker & { feature?: { properties?: { dc_name?: string } } };

  // Aggiungiamo la struttura feature con la targa
  marker.feature = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [point.long, point.lat],
    },
    properties: {
      dc_name: plate,
    },
  };

  marker.bindPopup(this.getCustomPopup(plate), {
    closeOnClick: false,
    autoClose: false,
    autoPan: false,
  });

  marker.on('mouseover', (event) => {
    marker.openPopup();
    marker.on('mouseout', (event) => {
      marker.closePopup();
    });
  });

  marker.on('click', (event) => {
    this.selectMarker$.next(positionData);
    if(marker.getPopup()?.isOpen()){
      marker.openPopup();
    }else{
      marker.closePopup();
    }
    marker.off('mouseout');
  });

  if (!this.positionDatas.some((data) => data.plate === positionData.plate))
    this.positionDatas.push(positionData);

  return marker;
}

  /**
   * Crea un marker
   * @param point punto in cui si vuole creare il marker
   * @param style stringa html stile marker
   * @returns marker creato
   */
  createMarker(point: Point, style: string): L.Marker {
    const customIcon: L.DivIcon = L.divIcon({
      className: 'marker-icon',
      html: style,
      popupAnchor: [11, 12],
    });

    const marker: L.Marker = L.marker([point.lat, point.long], {
      icon: customIcon,
    }) as L.Marker;

    return marker;
  }

  /**
   * Crea un marker cluster group tramite i dati realtime di veicoli
   * @param realtimeDatas dati realtime dei veicoli
   * @param map mappa su cui viene creato il markerClusterGroup
   * @returns L.MarkerClusterGroup con i marker creati
   */
  createMarkerClusterGroupByRealtimeData(
    realtimeDatas: RealtimeData[],
    map: L.Map
  ): L.MarkerClusterGroup {
  const maxZoom = map.getMaxZoom();
  let clusterGroup = L.markerClusterGroup({
    disableClusteringAtZoom: maxZoom,
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false,
  });

  realtimeDatas.forEach((realtimeData) => {
    const vehicle = realtimeData.vehicle;
    const realtime = realtimeData.realtime;
    const punto = new Point(realtime.latitude, realtime.longitude);

    // creazione del marker per il veicolo
    const marker = this.createVehicleMarker(
      punto,
      vehicle.plate,
      vehicle.worksite ? vehicle.worksite.name : null,
      vehicle.veId,
      undefined,
      realtime.direction,
      realtime.timestamp,
      realtime.active
    );

    clusterGroup.addLayer(marker);
  });

  clusterGroup = this.bindClusterGroupMouseOverEvent(clusterGroup); //bind del popup per il cluster che include tutte le targhe

  return clusterGroup;
}

  /**
   * Lega l'evento mouse event al L.MarkeClusterGroup passato per parametro,
   * in modo tale da mostrare il contenuto dei popup di tutti i marker inclusi nel cluster
   * @param clusterGroup L.MarkerClusterGroup a cui legare l'evento clustermouseover
   * @returns clusterGroup con l'evento legato
   */
  private bindClusterGroupMouseOverEvent(clusterGroup: L.MarkerClusterGroup): L.MarkerClusterGroup {
    clusterGroup.on('clustermouseover', (event: any) => {
      const clusterMarkers: L.Marker[] = event.propagatedFrom.getAllChildMarkers();

      // Estrazione e ordinamento marker
      const sortedMarkers = clusterMarkers
        .filter((marker: any) => marker.feature?.properties?.dc_name)
        .sort((a: any, b: any) =>
          a.feature.properties.dc_name.localeCompare(b.feature.properties.dc_name)
        );

      let popupContent =
        '<div class="container">' +
        '<div class="popup-scrollable">' +
        "<table class='clusterPopup-table'>" +
        '<tbody>';

      let rowContent = '';
      let columnCount = 0;

      // Creazione di 5 colonne con le targhe ordinate
      sortedMarkers.forEach((marker: any) => {
        rowContent += `<td style="white-space: nowrap">${marker.feature.properties.dc_name} |</td>`;
        columnCount++;

        if (columnCount === 5) {
          popupContent += `<tr>${rowContent}</tr>`;
          rowContent = ''; // reset della riga
          columnCount = 0; // reset del contatore delle colonne
        }
      });

      if (columnCount > 0) {
        popupContent += `<tr>${rowContent}</tr>`;
      }

      popupContent += '</tbody></table></div>' + '</div>';

      const popup = L.popup({
        autoPan: false,
      })
      .setLatLng(event.latlng)
      .setContent(this.getCustomPopup(popupContent));

      event.layer.bindPopup(popup).openPopup();
    });

    return clusterGroup;
  }





  /**
   * Crea un marker cluster group tramite dei marker
   * @param markers marker creati
   * @param map mappa su cui viene creato il markerClusterGroup
   * @returns L.MarkerClusterGroup con i marker passati
   */
  createMarkerClusterGroupByMarkers(markers: L.Marker[], map: L.Map): L.MarkerClusterGroup {
    const plateToggle = JSON.parse(
      this.sessionStorageService.getItem('plateToggle')
    );
    const maxZoom = map.getMaxZoom();
    let clusterGroup = L.markerClusterGroup({
      disableClusteringAtZoom: maxZoom,
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
    });

    markers.forEach((marker) => {
      if (plateToggle) {
        marker.openPopup();
      } else {
        marker.closePopup();
      }
      marker.addTo(clusterGroup);
    });

    clusterGroup = this.bindClusterGroupMouseOverEvent(clusterGroup); //bind del popup per il cluster che include tutte le targhe

    return clusterGroup;
  }

  /**
   * Crea un marker group con all'interno i marker creati tramite i punti passati
   * @param points punti su cui creare i marker
   * @param style stile dei marker nel layer group
   * @returns L.LayerGroup con i marker creati
   */
  createMarkerGroup(points: Point[], style: string): L.LayerGroup {
    const markerGroup: L.LayerGroup = L.layerGroup();
    points.forEach((point) => {
      const marker = this.createMarker(point, style);

      marker.addTo(markerGroup);
    });
    return markerGroup;
  }

  /**
   * Crea i marker per un percorso
   * @param points Array di punti
   * @param firstPoints Array di punti di inizio di ciascuna sessione che compone il percorso
   * @param map mappa su cui creare il percorso
   * @returns un layer group di marker
   */
  public createCustomPathVehicleMarkers(
    points: Point[],
    firstPoints: Point[]
  ): L.LayerGroup {
    const markerGroup = L.layerGroup();
    const waypoints = points.map((point) => L.latLng(point.lat, point.long));

    //aggiunta marker per i primi punti
    firstPoints.forEach((point, index) => {
      if (point.lat === 0 && point.long === 0) return; // Skip invalid points

      const marker = L.marker(L.latLng(point.lat, point.long), {
        icon: L.divIcon({
          className: 'error-icon',
          html: `<div style="color: white; padding: 5px;">${this.getCustomPositionMarker(
            (index + 1).toString()
          )}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 40],
        }),
      });
      markerGroup.addLayer(marker);
    });

    const endMarker = L.marker(waypoints[waypoints.length - 1], {
      icon: L.divIcon({
        className: 'error-icon',
        html: `<div style="color: white; padding: 5px;">${this.sessionEndMarker}</div>`,
        iconSize: [50, 20],
        iconAnchor: [10, 40],
      }),
    });
    markerGroup.addLayer(endMarker);

    return markerGroup;
  }

  /**
   * Crea un piano di routing custom
   * @param points Array di punti
   * @param firstPoints Array di punti di inizio di ciascuna sessione che compone il percorso
   * @returns un piano di routing L.Routing.Plan
   */
  public createVehicleCustomRoutingPlan(
    points: Point[],
    firstPoints: Point[]
  ): L.Routing.Plan {
    const waypoints = points.map((point) => L.latLng(point.lat, point.long));
    let firstPointCounter = 0;

    return new L.Routing.Plan(waypoints, {
      createMarker: (waypointIndex, waypoint, numberOfWaypoints) => {
        const currentFirstPosition = firstPoints[firstPointCounter];
        let markerIcon;

        markerIcon = L.divIcon({
          className: 'error-icon',
          html: `<div style="color: white; padding: 5px;">${this.getCustomPositionMarker(
            (firstPointCounter + 1).toString()
          )}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 40],
        });

        if (waypointIndex === waypoints.length - 1) {
          // Create a divIcon for the end point
          markerIcon = L.divIcon({
            className: 'error-icon',
            html: `<div style="color: white; padding: 5px;">${this.sessionEndMarker}</div>`,
            iconSize: [50, 20],
            iconAnchor: [10, 40],
          });
        }

        if (
          (currentFirstPosition &&
            JSON.stringify(
              L.latLng(currentFirstPosition.lat, currentFirstPosition.long)
            ) === JSON.stringify(waypoint.latLng)) ||
          waypointIndex === waypoints.length - 1
        ) {
          firstPointCounter++;
          return L.marker(waypoint.latLng, { icon: markerIcon });
        }
        return false;
      },
    });
  }

  createCustomPlaneRoutingControl(
    map: L.Map,
    customPlan: L.Routing.Plan
  ): L.Routing.Control {
    return L.Routing.control({
      show: false,
      plan: customPlan,
      routeWhileDragging: false,
      addWaypoints: false,
      router: new L.Routing.OSRMv1({
        serviceUrl: 'http://10.1.0.102:5000/route/v1',
      }),
    }).addTo(map);
  }

  /**
   * Permette di ottenere i primi punti validi (con latitudine e longitudine diversi da 0) di inizio e di fine di una serie di punti
   * @param points array di punti
   * @returns
   */
  getFirstValidEndpoints(points: Point[]) {
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
      endPoint: endPoint,
    };
  }

  /**
   * Permette di ottenere tutti i marker in una mappa
   * @param map mappa di cui prendere i marker
   * @returns array di L.Marker presenti nella mappa
   */
  getMapMarkers(map: L.Map): L.Marker[] {
    const markers: L.Marker[] = [];
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) markers.push(layer);
    });
    return markers;
  }

  /**
   * Filtra tutti i marker di una mappa per la targa all'interno popup
   * @param map mappa da cui prendere
   * @param plates targhe selezionate
   * @returns array di marker
   */
  filterMarkersByPlates(map: L.Map, plates: string[]): L.Marker[] {
    const markers: L.Marker[] = this.getMapMarkers(map);

    const plateFilteredMarkers = markers.filter((marker) => {
      const markerText = this.extractMarkerPopupContent(marker);
      return markerText ? plates.includes(markerText) : false;
    });

    return plateFilteredMarkers;
  }

  /**
   * Estrae il contenuto del pop
   * @param marker
   * @returns
   */
  extractMarkerPopupContent(marker: L.Marker): string | null {
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
  togglePopups(map: L.Map, toggleState: boolean) {
    const markers = this.getMapMarkers(map); // Marker della mappa

    markers.forEach((marker) => {
      if (toggleState) {
        marker.openPopup();
      } else {
        marker.closePopup();
      }
    });
  }

  /**
   * Rimuove tutti i layer rilvanti (marker e percorsi)
   * @param map mappa da cui rimuovere i layer
   */
  removeAllRelevantLayers(map: L.Map): void {
    if (map) {
      map.eachLayer((layer: L.Layer) => {
        if (
          layer instanceof L.Marker ||
          layer instanceof L.Polyline ||
          layer instanceof L.MarkerClusterGroup
        ) {
          map.removeLayer(layer);
        }
      });
    }
  }

  /**
   * Permette di aggiungere un geocoder per la ricerca di indirizzi sulla mappa passata
   * @param collapsed indica se la barra di ricerca deve essere inizialmente compressa o già estesa
   * @param placeholderText testo placeholder nella barra di ricerca
   * @param map mappa su cui ricercare e zommare a ricerca completa
   * @param markerVisibleTime tempo in cui il marker, che viene aggiunto dopo lo zoom sul punto preciso della ricerca, rimane visibile
   */
  addGeocoder(collapsed: boolean, placeholderText: string, map: L.Map, markerVisibleTime?: number){
    new (L.Control as any).geocoder({
      geocoder: (L.Control as any).Geocoder.nominatim({
        geocodingQueryParams: {
          countrycodes: 'it' // Per limitare la ricerca all'Italia
        }
      }),
      defaultMarkGeocode: false,
      collapsed: collapsed,
      placeholder: placeholderText
    })
    .on('markgeocode', (e: any) => {
      const center = e.geocode.center;

      map.setView(center, 16); //centra la mappa sul risultato

      //impostazione marker temporaneo
      const tempMarker = L.marker(center).addTo(map);
      setTimeout(() => {
        map.removeLayer(tempMarker);
      }, markerVisibleTime || 2000); //di default visibile 2 secondi
    })
    .addTo(map);
  }

  findCircleAtPoint(latlng: L.LatLng, map: L.Map, tolerance = 0.000001): L.Circle | null {
    let found: L.Circle | null = null;

    map.eachLayer(layer => {
      if (layer instanceof L.Circle) {
        const center = layer.getLatLng();
        if (Math.abs(center.lat - latlng.lat) < tolerance &&
            Math.abs(center.lng - latlng.lng) < tolerance) {
          found = layer;
        }
      }
    });

    return found;
  }

  /**
   * Permette di trovare le sessioni in un punto tramite una chiamata API
   * @param latitude latitudine del punto
   * @param longitude longitudine del punto
   * @param rangeKm range in km da quel punto in cui ricercare
   * @param dateFrom data inizio ricerca
   * @param dateTo data fine ricerca
   * @returns observable http get
   */
  findSessionsInPoint(latitude: number, longitude: number, rangeKm: number, dateFrom: Date, dateTo: Date): Observable<VehicleRangeKm[]> {
    const access_token = this.cookieService.get('user');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    });

    const params = new HttpParams()
    .set("latitude", latitude)
    .set("longitude", longitude)
    .set("km", rangeKm)
    .set("dateFrom", dateFrom.toString())
    .set("dateTo", dateTo.toString());

    return this.http.get<VehicleRangeKm[]>(`${serverUrl}/sessions/point`, { headers, params });
  }


  /**
   * Permette di ottenere la stringa svg del popup custom
   * @param msg messaggio all'interno del popup
   * @returns stringa contenente l'elemento svg
   */
  getCustomPopup(msg: string): string {
    return `
      <div class="custom-popup">
        <span class="popup-text">${msg}</span>
        <div class="popup-arrow"></div>
      </div>
    `;
  }

  /**
   * Permette di ottenere la stringa svg del marker per una posizione diversa dalla posizione di fine percorso
   * @param msg messaggio all'interno del popup
   * @returns stringa contenente l'elemento svg
   */
  getCustomPositionMarker(msg: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 50" width="60" height="50">
            <!-- Forma del pin GPS -->
            <path d="M30,3 C22,3 17,18 17,25 C17,32 30,45 30,45 C30,45 43,32 43,25 C43,18 38,3 30,3 Z" fill="#2196F3" stroke="#1976D2" stroke-width="2"/>
            <!-- Numero bianco al centro della testa -->
            <text x="50%" y="40%" font-size="12" text-anchor="middle" fill="#FFFFFF" dy=".3em">${msg}</text>
          </svg>
    `;
  }

  public get zoomIn$(): BehaviorSubject<{ point: Point; zoom: number } | null> {
    return this._zoomIn$;
  }
  public get togglePopups$(): Subject<boolean> {
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
  public get loadMultipleVehiclePositions$(): BehaviorSubject<RealtimeData[]> {
    return this._loadMultipleVehiclePositions$;
  }
  public get loadLayerGroup$(): BehaviorSubject<L.LayerGroup | null> {
    return this._loadLayerGroup$;
  }
  public get removeMarkers$(): BehaviorSubject<{ type: string; } | null> {
    return this._removeMarkers$;
  }
  public get resizeMap$(): Subject<void> {
    return this._resizeMap$;
  }
}
