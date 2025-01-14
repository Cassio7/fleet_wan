import { Injectable } from '@angular/core';
import { VehicleData } from '../../Models/VehicleData';
import { PlateFilterService } from '../plate-filter/plate-filter.service';
import { CantieriFilterService } from '../cantieri-filter/cantieri-filter.service';
import { BehaviorSubject, filter } from 'rxjs';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { GpsFilterService } from '../gps-filter/gps-filter.service';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { SessionFilterService } from '../session-filter/session-filter.service';
import { BlackboxGraphsService } from '../../Dashboard/Services/blackbox-graphs/blackbox-graphs.service';
import { AntennaFilterService } from '../antenna-filter/antenna-filter.service';
import { FormControl, FormGroup } from '@angular/forms';

export interface Filters {
  plate: string;
  cantieri: FormControl<string[] | null>;
  gps: FormControl<string[] | null>;
  antenna: FormControl<string[] | null>;
  sessione: FormControl<string[] | null>;
}
@Injectable({
  providedIn: 'root'
})
export class FiltersCommonService {
  applyFilters$: BehaviorSubject<Filters> = new BehaviorSubject<Filters>({
    plate: "",
    cantieri: new FormControl(null),
    gps: new FormControl(null),
    antenna: new FormControl(null),
    sessione: new FormControl(null)
  });

  // Utilizza un FormGroup con tipi fortemente tipizzati
  filtersForm = new FormGroup({
    plate: new FormControl<string | null>(null),
    cantieri: new FormControl<string[] | null>(null),
    gps: new FormControl<string[] | null>(null),
    antenna: new FormControl<string[] | null>(null),
    sessione: new FormControl<string[] | null>(null),
  });
  constructor(
    private plateFilterService: PlateFilterService,
    private cantieriFilterService: CantieriFilterService,
    private blackboxGraphService: BlackboxGraphsService,
    private checkErrorsService: CheckErrorsService,
    private gpsFilterService: GpsFilterService,
    private antennaFilterService: AntennaFilterService,
    private sessionFilterService: SessionFilterService,
    private sessionStorageService: SessionStorageService
  ) {
  }


  /**
   * Aggiorna tutte le opzioni di tutti i filtri in base ai veicoli passati
   * e invia un subject per l'aggiornamento di quest'ultimi nel componente
   * @param filteredVehicles veicoli da controllare
   */
  updateAllFiltersOption(filteredVehicles: VehicleData[]) {
    const cantieriOptions = this.cantieriFilterService.updateSelectedCantieri(filteredVehicles);

    const gpsOptions = this.gpsFilterService.updateSelectedOptions(filteredVehicles);
    this.gpsFilterService.selectedOptions = gpsOptions;

    const antennaOptions = this.antennaFilterService.updateSelectedOptions(filteredVehicles);
    this.antennaFilterService.selectedOptions = antennaOptions;

    const sessionOptions = this.sessionFilterService.updateSelectedOptions(filteredVehicles);
    this.sessionFilterService.selectedOptions = sessionOptions;
  }



  /**
   * Applica tutti i filtri sui veicoli passati
   * @param vehicles veicoli da filtrare
   * @param filters oggetto Filters che contiene i filtri per cui filtrare e non
   * @returns veicoli filtrati
   */
  applyAllFiltersOnVehicles(vehicles: VehicleData[], filters: Filters): VehicleData[] {
    let filteredVehicles: VehicleData[] = [...vehicles];
    const filterResults: VehicleData[][] = [];

    const allEmpty =
        filters.plate === "" &&
        (!filters.cantieri?.value || filters.cantieri.value.length === 0) &&
        (!filters.antenna?.value || filters.antenna.value.length === 0) &&
        (!filters.sessione?.value || filters.sessione.value.length === 0) &&
        (!filters.gps?.value || filters.gps.value.length === 0);

    if (allEmpty) {
        return [];
    }

    // Filtro per targa
    if (filters.plate) {
        const plateFiltered = this.plateFilterService.filterVehiclesByPlateResearch(filters.plate, vehicles);
        if (plateFiltered.length > 0)
            filterResults.push(plateFiltered);
    }

    // Filtro per cantieri
    if (filters.cantieri && filters.cantieri.value) {
        const cantieriFiltered = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, filters.cantieri.value);
        if (cantieriFiltered.length > 0)
            filterResults.push(cantieriFiltered);
    }

    // Filtro per stato GPS
    if (filters.gps && filters.gps.value) {
        const gpsCheck = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);
        const gpsFiltered = this.filterByStatus(gpsCheck, filters.gps.value, "GPS");
        if (gpsFiltered.length > 0)
            filterResults.push(gpsFiltered);
    }

    // Filtro per stato antenna
    if (filters.antenna && filters.antenna.value) {
        const antennaCheck = this.checkErrorsService.checkVehiclesAntennaErrors(vehicles);
        const antennaErrors = this.filterByStatus(antennaCheck, filters.antenna.value, "antenna");
        let antennaData = antennaErrors;
        if (filters.antenna.value.includes("Blackbox")) {
            const blackboxData = this.blackboxGraphService.getAllRFIDVehicles(vehicles);
            antennaData = [...antennaErrors, ...blackboxData.blackboxOnly];
        }
        if (antennaData.length > 0)
            filterResults.push(antennaData);
    }

    // Filtro per stato sessione
    if (filters.sessione && filters.sessione.value) {
        const sessionCheck = this.checkErrorsService.checkVehiclesSessionErrors(vehicles);
        const sessionFiltered = this.filterByStatus(sessionCheck, filters.sessione.value, "sessione");
        if (sessionFiltered.length > 0)
            filterResults.push(sessionFiltered);
    }

    //se non ci sono risultati da filtrare, ritorna un array vuoto
    if (filterResults.length === 0) {
        return [];
    }

    filteredVehicles = filterResults.reduce((acc, curr) => this.intersectVehicles(acc, curr), vehicles); //calcolo intersezione tra i veicoli filtrati

    this.updateAllFiltersOption(filteredVehicles);
    return filteredVehicles;
  }





  /**
   * Trova l'intersezione tra due array di veicoli
   * @param firstArray primo array di veicoli
   * @param secondArray secondo array di veicoli
   * @returns intersezione tra i due array
   */
  private intersectVehicles(firstArray: VehicleData[], secondArray: VehicleData[]): VehicleData[] {
    return firstArray.filter(firstVehicle =>
      secondArray.some(secondVehicle => secondVehicle.vehicle.id === firstVehicle.vehicle.id)
    );
  }

  /**
   * Filtra i veicoli in base allo stato
   * @param errorChecks controllo sugli errori
   * @param statuses array di stringhe sugli status
   * @param toCheck di cosa devono essere controllare gli errori
   * @returns array di veicoli concatenato
   */
  private filterByStatus(errorChecks: VehicleData[][], statuses: string[], toCheck: string): VehicleData[] {
    let result: VehicleData[] = [];
    switch(toCheck){
      case "GPS":
        if (statuses.includes("Funzionante")) {
          result = result.concat(errorChecks[0]);
        }
        if (statuses.includes("Warning") && errorChecks[1]) {
          result = result.concat(errorChecks[1]);
        }
        if (statuses.includes("Errore") && errorChecks[2]) {
          result = result.concat(errorChecks[2]);
        }
        break;
      case "antenna":
        if (statuses.includes("Funzionante")) {
          result = result.concat(errorChecks[0]);
        }
        if (statuses.includes("Errore") && errorChecks[1]) {
          result = result.concat(errorChecks[1]);
        }
        break;
      case "sessione":
        if (statuses.includes("Funzionante")) {
          result = result.concat(errorChecks[0]);
        }
        if (statuses.includes("Errore") && errorChecks[1]) {
          result = result.concat(errorChecks[1]);
        }
        break;
    }
    return result;
  }
}
