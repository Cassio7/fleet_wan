import { Injectable } from '@angular/core';
import { Vehicle } from '../../Models/Vehicle';
import { VehicleData } from '../../Models/VehicleData';
import { MatSort } from '@angular/material/sort';

@Injectable({
  providedIn: 'root'
})
export class SortService {

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
  sortVehiclesBySessioneAsc(vehiclesData: VehicleData[]): VehicleData[] {
    return vehiclesData
      .sort((a, b) => {
        const firstVehicleSessionDate = new Date(a.anomalies[0].date);
        const secondVehicleSessionDate = new Date(b.anomalies[0].date);

        return firstVehicleSessionDate.getTime() - secondVehicleSessionDate.getTime();
      });
  }



  /**
   * Ordina i veicoli in base all'ultima sessione valida con ordine decrescente
   * @param vehicles array di veicoli da ordinare
   * @returns array di veicoli ordinato
   */
  sortVehiclesBySessioneDesc(vehiclesData: VehicleData[]): VehicleData[] {
    return vehiclesData
      .sort((a, b) => {
        const firstVehicleSessionDate = new Date(a.anomalies[0].date);
        const secondVehicleSessionDate = new Date(b.anomalies[0].date);

        return secondVehicleSessionDate.getTime() - firstVehicleSessionDate.getTime();
      });
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

  /**
   * Reimposta il MatSort passato come parametro
   * @returns MatSort reimpostato
   */
  resetMatSort(sort: MatSort): MatSort{
    if (sort) {
      sort.active = '';
      sort.direction = '';
      sort.sortChange.emit();
    }
    return sort;
  }


  /**
   * Confronta due valori numerici o stringhe e restituisce un valore che indica l'ordine relativo.
   *
   * @param a - Il primo valore da confrontare.
   * @param b - Il secondo valore da confrontare.
   * @param isAsc - Se true, il confronto avviene in ordine ascendente, altrimenti in ordine discendente.
   * @returns - Restituisce un valore negativo se `a` è minore di `b`, positivo se `a` è maggiore di `b`, e 0 se sono uguali.
   */
  compare(a: string | number | Date, b: string | number | Date, isAsc: boolean): number {
    if (a === b) return 0;
    if (a instanceof Date && b instanceof Date) {
      return (a.getTime() - b.getTime()) * (isAsc ? 1 : -1);
    }
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }


}
