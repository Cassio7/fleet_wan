import { Injectable } from '@angular/core';
import { Session } from '../../Models/Session';
import { Vehicle } from '../../Models/Vehicle';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { VehicleData } from '../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class SortService {

  constructor(
    private sessionStorageService: SessionStorageService
  ){}

  /**
   * Filtra "allVehicles" con i veicoli passati, in modo da ottenere lo stesso ordine di visualizzazione
   * @param selectedVehicles veicoli selezionati
   * @returns array di veicoli filtrato
   */
  vehiclesInDefaultOrder(selectedVehicles: VehicleData[]): VehicleData[] {
    // Parse and retrieve all vehicles data from session storage
    const allVehiclesData: VehicleData[] = JSON.parse(this.sessionStorageService.getItem("allData") || "[]");

    // Ensure selectedVehicles is not null or undefined
    if (!selectedVehicles || selectedVehicles.length === 0) {
        return [];
    }

    // Filter vehicles that match veId in the selectedVehicles array
    const filteredVehicles = allVehiclesData.filter(allVehicle =>
        selectedVehicles.some(selected => selected.vehicle?.veId === allVehicle.vehicle?.veId)
    );

    return filteredVehicles;
}


  /**
   * Ordina i veicoli in base alla targa con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByPlateAsc(vehicles: (VehicleData | Vehicle)[]): (VehicleData | Vehicle)[] {
    return [...vehicles].sort((a, b) => {
      //determinare il tipo di oggetto passato come parametro
      if ('plate' in a && 'plate' in b) { //caso in cui sia di tipo Vehicle[]
        return a.plate.localeCompare(b.plate);
      } else if ('vehicle' in a && 'vehicle' in b) {//caso in cui sia di tipo VehicleData[]
        return a.vehicle.plate.localeCompare(b.vehicle.plate);
      }
      return 0;
    });
  }


  /**
   * Ordina i veicoli in base alla targa con ordine decrescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByPlateDesc(vehicles: (VehicleData | Vehicle)[]): (VehicleData | Vehicle)[] {
    return [...vehicles].sort((a, b) => {
      const plateA = 'vehicle' in a ? a.vehicle.plate : a.plate;
      const plateB = 'vehicle' in b ? b.vehicle.plate : b.plate;
      if (!plateA || !plateB) return 0;
      return plateB.localeCompare(plateA); // Decrescente
    });
  }

  /**
   * Ordina i veicoli in base al cantiere di appartenza con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByCantiereAsc(vehicles: (VehicleData | Vehicle)[]): any[] {
    return [...vehicles].sort((a, b) => {
      const nameA = 'vehicle' in a && a.vehicle.worksite?.name ? a.vehicle.worksite.name : '';
      const nameB = 'vehicle' in b && b.vehicle.worksite?.name ? b.vehicle.worksite.name : '';
      if (!nameA || !nameB) return 0;
      return nameA.localeCompare(nameB); // Crescente
    });
  }

  /**
   * Ordina i veicoli in base al cantiere di appartenza con ordine decrescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByCantiereDesc(vehicles: (VehicleData | Vehicle)[]): any[] {
    return [...vehicles].sort((a, b) => {
      const nameA = 'vehicle' in a && a.vehicle.worksite?.name ? a.vehicle.worksite.name : '';
      const nameB = 'vehicle' in b && b.vehicle.worksite?.name ? b.vehicle.worksite.name : '';
      if (!nameA || !nameB) return 0;
      return nameB.localeCompare(nameA); // Decrescente
    });
  }

  /**
   * Ordina i veicoli in base al modello con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByModelAsc(vehicles: (VehicleData | Vehicle)[]): any[] {
    return [...vehicles].sort((a, b) => {
      const modelA = 'vehicle' in a && a.vehicle.model ? a.vehicle.model : '';
      const modelB = 'vehicle' in b && b.vehicle.model ? b.vehicle.model : '';
      if (!modelA || !modelB) return 0;
      return modelA.localeCompare(modelB); // Crescente
    });
  }

  /**
   * Ordina i veicoli in base al modello con ordine decrescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByModelDesc(vehicles: (VehicleData | Vehicle)[]): any[] {
    return [...vehicles].sort((a, b) => {
      const modelA = 'vehicle' in a && a.vehicle.model ? a.vehicle.model : '';
      const modelB = 'vehicle' in b && b.vehicle.model ? b.vehicle.model : '';
      if (!modelA || !modelB) return 0;
      return modelB.localeCompare(modelA); // Decrescente
    });
  }

  /**
   * Ordina i veicoli in base all'ultima sessione valida con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesBySessioneAsc(vehiclesData: VehicleData[]): any[] {
    return vehiclesData
      .flatMap(obj => obj.anomalies ?? [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Crescente per data
  }

  /**
   * Ordina i veicoli in base all'ultima sessione valida con ordine decrescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesBySessioneDesc(vehiclesData: VehicleData[]): any[] {
    return vehiclesData
      .flatMap(obj => obj.anomalies ?? [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Decrescente per data
  }

  /**
   * Ordina i veicoli in base al primo evento in ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByFirstEventAsc(vehiclesData: VehicleData[]): any[] {
    return vehiclesData
      .flatMap(obj => obj.anomalies ?? [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Crescente per data
  }
}
