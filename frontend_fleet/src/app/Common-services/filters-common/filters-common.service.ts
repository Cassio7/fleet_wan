import { Injectable } from '@angular/core';
import { VehicleData } from '../../Models/VehicleData';
import { PlateFilterService } from '../plate-filter/plate-filter.service';
import { CantieriFilterService } from '../cantieri-filter/cantieri-filter.service';
import { BehaviorSubject, filter } from 'rxjs';
import { GpsFilterService } from '../gps-filter/gps-filter.service';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { SessionFilterService } from '../session-filter/session-filter.service';
import { AntennaFilterService } from '../antenna-filter/antenna-filter.service';
import { FormControl, FormGroup } from '@angular/forms';
import { Vehicle } from '../../Models/Vehicle';

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

  constructor(
    private plateFilterService: PlateFilterService,
    private cantieriFilterService: CantieriFilterService,
    private checkErrorsService: CheckErrorsService,
    private gpsFilterService: GpsFilterService,
    private antennaFilterService: AntennaFilterService,
    private sessionFilterService: SessionFilterService,
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
  applyAllFiltersOnVehicles(vehicles: (VehicleData | Vehicle)[], filters: Filters): (VehicleData | Vehicle)[] {
    // console.log("Veicoli su cui applicare tutti i filtri: ", vehicles);
    // console.log("Valore filtro cantieri: ", filters.cantieri?.value);
    // console.log("Valore filtro GPS: ", filters.gps?.value);
    // console.log("Valore filtro antenna: ", filters.antenna?.value);
    // console.log("Valore filtro sessione: ", filters.sessione?.value);

    //controllo se tutti i filtri sono vuoti
    const areAllFiltersEmpty =
        (!filters.plate || filters.plate.trim() === "") &&
        (!filters.cantieri?.value || filters.cantieri.value.length === 0) &&
        (!filters.gps?.value || filters.gps.value.length === 0) &&
        (!filters.antenna?.value || filters.antenna.value.length === 0) &&
        (!filters.sessione?.value || filters.sessione.value.length === 0);

    if (areAllFiltersEmpty) return []; //ritorno array vuoto in caso tutti i filtri siano vuoti

    let arrayTarghe: number[] = [];
    let arrayCantieri: number[] = [];
    let arrayGps: number[] = [];
    let arrayAntenne: number[] = [];
    let arraySessioni: number[] = [];

    if (filters.plate) {
      arrayTarghe = this.getVeIds(this.plateFilterService.filterVehiclesByPlateResearch(filters.plate, vehicles) as VehicleData[]);
    }

    if ('veId' in vehicles[0]) {
      if (filters.cantieri?.value) {
          arrayCantieri = (this.cantieriFilterService.filterVehiclesByCantieri(vehicles, filters.cantieri.value) as Vehicle[]).map(vehicle => vehicle.veId);
      }
    }

    if ('vehicle' in vehicles[0]) {
      if (filters.cantieri?.value) {
          arrayCantieri = (this.cantieriFilterService.filterVehiclesByCantieri(vehicles, filters.cantieri.value) as VehicleData[]).map(vehicle => vehicle.vehicle.veId);
      }

      if (filters.gps?.value) {
          const gpsCheck = this.filterByStatus(this.checkErrorsService.checkVehiclesGpsErrors(vehicles as VehicleData[]), filters.gps.value, "GPS");
          arrayGps = this.getVeIds(gpsCheck);
      }

      if (filters.antenna?.value) {
          let antennaCheck = this.filterByStatus(this.checkErrorsService.checkVehiclesAntennaErrors(vehicles as VehicleData[]), filters.antenna.value, "antenna");

          if (filters.antenna.value.includes("Blackbox")) {
              antennaCheck = [
                  ...antennaCheck,
                  ...this.antennaFilterService.getAllRFIDVehicles(vehicles as VehicleData[]).blackboxOnly
              ];
          }

          arrayAntenne = this.getVeIds(antennaCheck);
      }

      if (filters.sessione?.value) {
          const sessionCheck = this.filterByStatus(this.checkErrorsService.checkVehiclesSessionErrors(vehicles as VehicleData[]), filters.sessione.value, "sessione");
          arraySessioni = this.getVeIds(sessionCheck);
      }
    }

    //intersezione tra i veicoli
    const filteredVehicles = vehicles.filter(veicolo => {
      if ('vehicle' in veicolo) {
          if (filters.gps?.value?.length && arrayGps.indexOf(veicolo.vehicle.veId) === -1) return false;
          if (filters.plate && arrayTarghe.indexOf(veicolo.vehicle.veId) === -1) return false;
          if (filters.cantieri?.value?.length && arrayCantieri.indexOf(veicolo.vehicle.veId) === -1) return false;
          if (filters.antenna?.value?.length && arrayAntenne.indexOf(veicolo.vehicle.veId) === -1) return false;
          if (filters.sessione?.value?.length && arraySessioni.indexOf(veicolo.vehicle.veId) === -1) return false;
      } else if ('veId' in veicolo) {
          if (filters.plate && arrayTarghe.indexOf(veicolo.veId) === -1) return false;
          if (filters.cantieri?.value?.length && arrayCantieri.indexOf(veicolo.veId) === -1) return false;
      }
      return true;
    });

    // if('vehicle' in filteredVehicles[0]){
    //   this.updateAllFiltersOption(filteredVehicles as VehicleData[]);
    // }else if('veId' in filteredVehicles[0]){
    //   this.cantieriFilterService.updateSelectedCantieri(filteredVehicles);
    // }

    return filteredVehicles;



    // let filteredVehicles: VehicleData[] = [...vehicles];
    // const filterResults: VehicleData[][] = [];
    // let plateFiltered: VehicleData[] = [];
    // let cantieriFiltered: VehicleData[] = [];

    // // Filtro per targa
    // if(filters.plate){
    //   plateFiltered = this.plateFilterService.filterVehiclesByPlateResearch(filters.plate, vehicles) as VehicleData[];
    // }else{
    //   plateFiltered = vehicles;
    // }
    // filterResults.push(plateFiltered);

    // if(filters.plate){
    //   const updatedCantieri = this.cantieriFilterService.updateSelectedCantieri(plateFiltered);
    //   filters.cantieri.setValue(updatedCantieri);
    //   filters.gps.setValue(this.gpsFilterService.updateSelectedOptions(plateFiltered));
    //   filters.antenna.setValue(this.antennaFilterService.updateSelectedOptions(plateFiltered));
    //   filters.sessione.setValue(this.sessionFilterService.updateSelectedOptions(plateFiltered));
    // }else{
    //   const allCantieri = this.cantieriFilterService.vehiclesCantieriOnce(plateFiltered);
    //   filters.cantieri.setValue(allCantieri);
    // }

    // // Filtro per cantieri
    // if (filters.cantieri && filters.cantieri.value) {
    //     if(plateFiltered){
    //       cantieriFiltered = this.cantieriFilterService.filterVehiclesByCantieri(plateFiltered, filters.cantieri.value) as VehicleData[];
    //     }else{
    //       cantieriFiltered = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, filters.cantieri.value) as VehicleData[];
    //     }
    //     filterResults.push(cantieriFiltered);
    // }

    // // Filtro per stato GPS
    // if (filters.gps && filters.gps.value) {
    //     const gpsCheck = this.checkErrorsService.checkVehiclesGpsErrors(cantieriFiltered);
    //     const gpsFiltered = this.filterByStatus(gpsCheck, filters.gps.value, "GPS");
    //     filterResults.push(gpsFiltered);
    // }

    // // Filtro per stato antenna
    // if (filters.antenna && filters.antenna.value) {
    //     const antennaCheck = this.checkErrorsService.checkVehiclesAntennaErrors(cantieriFiltered);
    //     const antennaErrors = this.filterByStatus(antennaCheck, filters.antenna.value, "antenna");
    //     let antennaData = antennaErrors;
    //     if (filters.antenna.value.includes("Blackbox")) {
    //         const blackboxData = this.blackboxGraphService.getAllRFIDVehicles(cantieriFiltered);
    //         antennaData = [...antennaErrors, ...blackboxData.blackboxOnly];
    //     }
    //     filterResults.push(antennaData);
    // }

    // // Filtro per stato sessione
    // if (filters.sessione && filters.sessione.value) {
    //     const sessionCheck = this.checkErrorsService.checkVehiclesSessionErrors(cantieriFiltered);
    //     const sessionFiltered = this.filterByStatus(sessionCheck, filters.sessione.value, "sessione");
    //     filterResults.push(sessionFiltered);
    // }

    // //se non ci sono risultati da filtrare, ritorna un array vuoto
    // if (filterResults.length === 0) {
    //     return [];
    // }

    // filteredVehicles = filterResults.reduce((acc, curr) => this.intersectVehicles(acc, curr), vehicles); //calcolo intersezione tra i veicoli filtrati

    // this.updateAllFiltersOption(filteredVehicles);
    // return filteredVehicles;
  }


  getVeIds(vehicles: (VehicleData | Vehicle)[]): number[] {
    return vehicles.map(vehicle => {
      if ('vehicle' in vehicle) {
        return vehicle.vehicle.veId;
      } else {
        return vehicle.veId;
      }
    });
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
