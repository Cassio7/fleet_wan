import { Injectable } from '@angular/core';
import L from 'leaflet';
import { BehaviorSubject, map, Subject } from 'rxjs';
import { VehicleData } from '../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private readonly _loadMap$: BehaviorSubject<VehicleData|null> = new BehaviorSubject<VehicleData|null>(null);

  constructor() { }

  /**
   * Inizializza
   * @param lat
   * @param long
   */
  initMap(map: L.Map, lat: number, long: number): L.Map {
    map = L.map('map', {
      center: [lat, long],
      zoom: 14
    });

    const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    tiles.addTo(map);
    return map;
  }

  removeMap(map: L.Map){
    if(map){
      map.remove();
    }
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
    const marker = L.marker([lat, long]); //creazione del marker
    marker.bindPopup(msg, { autoClose: false });

    //Apre il popup quando il marker viene aggiunto
    marker.on('add', () => {
      marker.openPopup();
    });
    //Apre il popup quando si passa sopra al marker
    marker.on('mouseover', () =>{
      marker.openPopup();
    });

    return marker;
  }

  public get loadMap$(): BehaviorSubject<VehicleData|null> {
    return this._loadMap$;
  }
}
