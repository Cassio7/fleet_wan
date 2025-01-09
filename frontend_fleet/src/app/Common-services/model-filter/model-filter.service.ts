import { Injectable } from '@angular/core';
import { Vehicle } from '../../Models/Vehicle';
import { VehicleData } from '../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class ModelFilterService {

  constructor() { }

  /**
   * Filtra i veicoli in base ai modelli dei veicoli selezionati.
   * @param selectedModels - Array di modelli selezionati.
   * @param vehicles - Array di veicoli da filtrare.
   * @returns Un array di veicoli che corrispondono ai modelli selezionati.
   */
  filterVehiclesByModels(selectedModels: string[], vehicles: Vehicle[]): any[] {
    if (!selectedModels.length) return vehicles;
    const modelsSet = new Set(selectedModels);
    return vehicles.filter(vehicle => modelsSet.has(vehicle.model));
  }

  /**
   * Filtra i modelli duplicati
   * @param vehicles veicoli dai quali prendere i modelli
   * @returns array di veicoli filtrati
   */
  filterVehiclesModelsDuplicates(vehicles: VehicleData[]) {
    const seenModels = new Set<string>(); // Set per tracciare i modelli unici
    return vehicles.filter(vehicle => {
      if (seenModels.has(vehicle.vehicle.model)) {
        return false;
      }
      seenModels.add(vehicle.vehicle.model);
      return true;
    });
  }
}
