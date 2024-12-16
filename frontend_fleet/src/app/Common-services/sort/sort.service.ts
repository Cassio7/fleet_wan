import { Injectable } from '@angular/core';
import { Session } from '../../Models/Session';
import { Vehicle } from '../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class SortService {

  /**
   * Ordina i veicoli in base alla targa con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByPlateAsc(vehicles: Vehicle[]): Vehicle[] {
    return [...vehicles].sort((a, b) => {
      if (!a || !b) return 0;
      return a.plate.localeCompare(b.plate) ?? 0;
    });
  }

  /**
   * Ordina i veicoli in base alla targa con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByPlateDesc(vehicles: Vehicle[]): Vehicle[] {
    return [...vehicles].sort((a, b) => {
      // Check if both a and b have plate properties
      const plateA = a.plate;
      const plateB = b.plate;

      // If either plate is missing, consider them equal (return 0)
      if (!plateA || !plateB) {
        return 0;
      }

      // Compare the plates, ensuring they are both strings
      return String(plateB).localeCompare(String(plateA));
    });
  }



  /**
   * Ordina i veicoli in base al cantiere di appartenza con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByCantiereAsc(vehicles: Vehicle[]): Vehicle[] {
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
  sortVehiclesByCantiereDesc(vehicles: Vehicle[]): Vehicle[] {
    return [...vehicles].sort((a, b) => {
      if (!a.worksite?.name || !b.worksite?.name) return 0;
      return b.worksite.name.localeCompare(a.worksite.name) ?? 0;
    });
  }

  /**
   * Ordina i veicoli in base al modello con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByModelAsc(vehicles: Vehicle[]): Vehicle[] {
    return [...vehicles].sort((a, b) => {
      if (!a.model || !b.model) return 0;
      return a.model.localeCompare(b.model);
    });
  }

  /**
   * Ordina i veicoli in base al modello con ordine decrescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByModelDesc(vehicles: Vehicle[]): Vehicle[] {
    return [...vehicles].sort((a, b) => {
      if (!a.model || !b.model) return 0;
      return b.model.localeCompare(a.model);
    });
  }

  /**
   * Ordina i veicoli in base all'ultima sessione valida con ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesBySessioneAsc(vehicles: Vehicle[]): Vehicle[] {
    return vehicles.sort((a, b) => {
      const dateA = new Date(a.lastValidSession.period_from);
      const dateB = new Date(b.lastValidSession.period_from);
      return dateA.getTime() - dateB.getTime();
    });
  }

  /**
   * Ordina i veicoli in base all'ultima sessione valida con ordine decrescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesBySessioneDesc(vehicles: Vehicle[]): Vehicle[] {
    return vehicles.sort((a, b) => {
      const dateA = new Date(a.lastValidSession.period_from);
      const dateB = new Date(b.lastValidSession.period_from);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Ordina i veicoli in base al first event in ordine crescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesByFirstEventAsc(vehicles: Vehicle[]) {
    return vehicles.sort((a, b) => {
      if (a.firstEvent && b.firstEvent) {
        const dateA = new Date(a.firstEvent);
        const dateB = new Date(b.firstEvent);
        return dateA.getTime() - dateB.getTime();
      }
      return 0;
    });
  }

}


