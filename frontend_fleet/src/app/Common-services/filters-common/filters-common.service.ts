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
    this.cantieriFilterService.updateSelectedCantieri(filteredVehicles);
    this.gpsFilterService.updateSelectedOptions(filteredVehicles);
    this.antennaFilterService.updateSelectedOptions(filteredVehicles);
    this.sessionFilterService.updateSelectedOptions(filteredVehicles);
  }



  /**
   * Applica tutti i filtri sui veicoli passati
   * @param vehicles veicoli da filtrare
   * @param filters oggetto Filters che contiene i filtri per cui filtrare e non
   * @returns veicoli filtrati
   */
  applyAllFiltersOnVehicles(vehicles: VehicleData[], filters: Filters): VehicleData[] {
    console.log("filtrat tutto! ");
    console.log("plate.value: ", filters.plate);
    console.log("cantieri.value: ", filters.cantieri.value);
    console.log("antenna.value: ", filters.antenna.value);
    console.log("gps.value: ", filters.gps.value);
    console.log("session.value: ", filters.sessione.value);
    let filteredVehicles: VehicleData[] = [...vehicles];
    const filterResults: VehicleData[][] = [];
    let plateFiltered: VehicleData[] = [];
    let cantieriFiltered: VehicleData[] = [];

    // Filtro per targa
    plateFiltered = this.plateFilterService.filterVehiclesByPlateResearch(filters.plate, vehicles);
    filterResults.push(plateFiltered);
    console.log("filtrato per  plate: ", plateFiltered);

    if(filters.plate){
      const updatedCantieri = this.cantieriFilterService.updateSelectedCantieri(plateFiltered);
      filters.cantieri.setValue(updatedCantieri);
      filters.gps.setValue(this.gpsFilterService.updateSelectedOptions(plateFiltered));
      filters.antenna.setValue(this.antennaFilterService.updateSelectedOptions(plateFiltered));
      filters.sessione.setValue(this.sessionFilterService.updateSelectedOptions(plateFiltered));
    }else{
      const allCantieri = this.cantieriFilterService.vehiclesCantieriOnce(plateFiltered);
      filters.cantieri.setValue(allCantieri);
    }

    // Filtro per cantieri
    if (filters.cantieri && filters.cantieri.value) {
        if(plateFiltered){
          console.log("entro su plateFiltered: ", plateFiltered);
          cantieriFiltered = this.cantieriFilterService.filterVehiclesByCantieri(plateFiltered, filters.cantieri.value);
        }else{
          cantieriFiltered = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, filters.cantieri.value);
        }
        console.log("cantieriFiltered: ", cantieriFiltered);
        filterResults.push(cantieriFiltered);
    }

    // Filtro per stato GPS
    if (filters.gps && filters.gps.value) {
        const gpsCheck = this.checkErrorsService.checkVehiclesGpsErrors(cantieriFiltered);
        console.log("gpsCheck: ", gpsCheck);
        const gpsFiltered = this.filterByStatus(gpsCheck, filters.gps.value, "GPS");
        console.log("gpsFiltered: ", gpsFiltered);
        filterResults.push(gpsFiltered);
        console.log("filtrato per  gps: ", gpsFiltered);
    }

    // Filtro per stato antenna
    if (filters.antenna && filters.antenna.value) {
        const antennaCheck = this.checkErrorsService.checkVehiclesAntennaErrors(cantieriFiltered);
        const antennaErrors = this.filterByStatus(antennaCheck, filters.antenna.value, "antenna");
        let antennaData = antennaErrors;
        if (filters.antenna.value.includes("Blackbox")) {
            const blackboxData = this.blackboxGraphService.getAllRFIDVehicles(cantieriFiltered);
            antennaData = [...antennaErrors, ...blackboxData.blackboxOnly];
        }
        filterResults.push(antennaData);
        console.log("filtrato per  antenna: ", antennaData);
    }

    // Filtro per stato sessione
    if (filters.sessione && filters.sessione.value) {
        const sessionCheck = this.checkErrorsService.checkVehiclesSessionErrors(cantieriFiltered);
        const sessionFiltered = this.filterByStatus(sessionCheck, filters.sessione.value, "sessione");
        filterResults.push(sessionFiltered);
        console.log("filtrato per  session: ", sessionFiltered);
    }

    //se non ci sono risultati da filtrare, ritorna un array vuoto
    if (filterResults.length === 0) {
        return [];
    }

    filteredVehicles = filterResults.reduce((acc, curr) => this.intersectVehicles(acc, curr), vehicles); //calcolo intersezione tra i veicoli filtrati

    console.log("filteredVehicles: ", filteredVehicles);
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
      secondArray.some(secondVehicle => secondVehicle.vehicle.veId === firstVehicle.vehicle.veId)
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
