import { Injectable } from '@angular/core';
import { VehicleData } from '../../Models/VehicleData';
import { PlateFilterService } from '../plate-filter/plate-filter.service';
import { CantieriFilterService } from '../cantieri-filter/cantieri-filter.service';
import { BehaviorSubject, filter } from 'rxjs';
import { SessionStorageService } from '../sessionStorage/session-storage.service';

export interface Filters {
  plate: string | null;
  cantieri: string[] | null;
  gps: string[] | null;
  antenna: string[] | null;
  sessione: string[] | null;
}
@Injectable({
  providedIn: 'root'
})
export class FiltersCommonService {
  applyFilters$: BehaviorSubject<Filters> = new BehaviorSubject<Filters>({
    plate: null,
    cantieri: null,
    gps: null,
    antenna: null,
    sessione: null
  });
  constructor(
    private plateFilterService: PlateFilterService,
    private cantieriFilterService: CantieriFilterService,
    private sessionStorageService: SessionStorageService
  ) { }

  /**
   * Applica tutti i filtri sui veicoli passati
   * @param vehicles veicoli da filtrare
   * @param filters oggetto Filters che contiene i filtri per cui filtrare e non
   * @returns veicoli filtrati
   */
  applyAllFiltersOnVehicles(vehicles: VehicleData[], filters: Filters): VehicleData[] {
    console.log("filters from commmon filters service: ", filters);
    // Array per raccogliere i veicoli filtrati da ogni filtro attivato
    let filteredVehicles: VehicleData[][] = [];

    // Applica il filtro per targa
    if (filters.plate) {
      const plateResearch = filters.plate;
      const plateFilteredVehicles = this.plateFilterService.filterVehiclesByPlateResearch(plateResearch, vehicles);
      console.log("attivato filtro per targa: ", plateFilteredVehicles);
      filteredVehicles.push(plateFilteredVehicles);
    }

    // Applica il filtro per cantieri
    if (filters.cantieri) {
      const cantieri = filters.cantieri;
      const cantieriFilteredVehicles = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, cantieri);
      console.log("attivato filtro per cantieri: ", cantieriFilteredVehicles);
      filteredVehicles.push(cantieriFilteredVehicles);
    }

    // Applica il filtro per gps
    if (filters.gps) {
      console.log("attivato filtro per gps");
      const gps = filters.gps;
      // const gpsFilteredVehicles = this.gpsFilterService.filterVehiclesByGps(vehicles, gps);
      // filteredVehicles.push(gpsFilteredVehicles);
    }

    // Applica il filtro per antenna
    if (filters.antenna) {
      console.log("attivato filtro per antenna");
      const antenna = filters.antenna;
      // const antennaFilteredVehicles = this.antennaFilterService.filterVehiclesByAntenna(vehicles, antenna);
      // filteredVehicles.push(antennaFilteredVehicles);
    }

    // Applica il filtro per sessione
    if (filters.sessione) {
      console.log("attivato filtro per sessione");
      const sessione = filters.sessione;
      // const sessioneFilteredVehicles = this.sessioneFilterService.filterVehiclesBySessione(vehicles, sessione);
      // filteredVehicles.push(sessioneFilteredVehicles);
    }

    // Trova l'intersezione tra tutti gli array filtrati
    const result = filteredVehicles.reduce((intersection, currentArray) => {
      return intersection.filter(vehicle =>
        currentArray.some(currentVehicle => currentVehicle.vehicle.id === vehicle.vehicle.id)
      );
    }, vehicles);

    console.log("Veicoli filtrati da tutti i filtri: ", result);
    filteredVehicles = [];
    return result;
  }


}
