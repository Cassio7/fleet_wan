import { Injectable } from '@angular/core';
import L from 'leaflet';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  constructor() { }

  /**
   * Inizializza
   * @param lat
   * @param long
   */
  initMap(map: L.Map, lat: number, long: number): L.Map {
    map = L.map('map', {
      center: [lat, long],
      zoom: 15
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(map);
    return map;
  }

  /**
   * Aggiunge un marker alla mappa
   * @param marker marker da aggiugere
   */
  addMarker(map: L.Map, marker: L.Marker<any>){
    marker.addTo(map);
  }

  /**
   * Permette di creare un marker di Lea Flet
   * @param lat latitudine della posizione
   * @param long longitudine della posizione
   * @param msg contenuto del messaggio che appare onMouseOver
   * @returns marker Lea Flet
   */
  createMarker(lat: number, long: number, msg: string): L.Marker<any>{
    const marker = L.marker([lat, long]);
    marker.bindPopup(msg, { autoClose: false });

    marker.on('mouseover', () => {
      marker.openPopup();
    });

    marker.on('mouseout', () => {
      marker.closePopup();
    });
    return marker;
  }
}
