import { Injectable } from '@angular/core';
import { Session } from '../../../Models/Session';

@Injectable({
  providedIn: 'root'
})
export class SortService {

  /**
   * Ordina i veicoli in base alla targa con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByPlateAsc(vehicles: any[]): any[] {
    return [...vehicles].sort((a, b) => {
      if (!a.vehicle || !b.vehicle) return 0;
      return a.vehicle.plate.localeCompare(b.vehicle.plate) ?? 0;
    });
  }

  /**
   * Ordina i veicoli in base alla targa con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByPlateDesc(vehicles: any[]): any[] {
    return [...vehicles].sort((a, b) => {
      // Check if both a and b have vehicle and plate properties
      if (!a.vehicle || !b.vehicle || !a.vehicle.plate || !b.vehicle.plate) {
        return 0;  // If either plate is missing, consider them equal
      }

      // Compare the plates, handling cases where plate might not be a string
      return String(b.vehicle.plate).localeCompare(String(a.vehicle.plate));
    });
  }

  /**
   * Ordina i veicoli in base al cantiere di appartenza con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByCantiereAsc(vehicles: any[]): any[] {
    return [...vehicles].sort((a, b) => {
      if (!a.worksite?.name || !b.worksite?.name) return 0;
      return a.worksite.name.localeCompare(b.worksite.name) ?? 0;
    });
  }

  /**
   * Ordina i veicoli in base al cantiere di appartenenza con ordine descrescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByCantiereDesc(vehicles: any[]): any[] {
    return [...vehicles].sort((a, b) => {
      if (!a.worksite?.name || !b.worksite?.name) return 0;
      return b.worksite.name.localeCompare(a.worksite.name) ?? 0;
    });
  }

  /**
   * Ordina i veicoli in base all'ultima sessione valida con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesBySessioneAsc(vehicles: any[]): any[] {
    return vehicles.sort((a, b) => {
      const dateA = new Date(a.lastValidSession);
      const dateB = new Date(b.lastValidSession);
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * Ordina i veicoli in base all'ultima sessione valida con ordine decrescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesBySessioneDesc(vehicles: any[]): any[] {
    return vehicles.sort((a, b) => {
      const dateA = new Date(a.lastValidSession);
      const dateB = new Date(b.lastValidSession);
      return dateB.getTime() - dateA.getTime();
    });
  }
}


