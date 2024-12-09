import { Injectable } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class MezziFilterService {
  private _filteredVehicles: Vehicle[] = [];

  constructor() { }

  /**
   * Filtra i veicoli in base alle targhe selezionate.
   * @param selectedPlates - Array di targhe selezionate.
   * @param vehicles - Array di veicoli da filtrare.
   * @returns Un array di veicoli che corrispondono alle targhe selezionate.
   */
  filterVehiclesByPlates(selectedPlates: string[], vehicles: Vehicle[]): Vehicle[] {
    if (!selectedPlates.length) return vehicles;  // Return all vehicles if no plates are selected.
    const platesSet = new Set(selectedPlates); // Using a Set for fast lookup.
    return vehicles.filter(vehicle => platesSet.has(vehicle.plate));
  }

  /**
   * Filtra i veicoli in base ai modelli selezionati.
   * @param selectedModels - Array di modelli selezionati.
   * @param vehicles - Array di veicoli da filtrare.
   * @returns Un array di veicoli che corrispondono ai modelli selezionati.
   */
  filterVehiclesByModels(selectedModels: string[], vehicles: Vehicle[]): Vehicle[] {
    if (!selectedModels.length) return vehicles;
    const modelsSet = new Set(selectedModels);
    return vehicles.filter(vehicle => modelsSet.has(vehicle.model));
  }

  /**
   * Filtra i modelli duplicati
   * @param vehicles veicoli dai quali prendere i modelli
   * @returns array di veicoli filtrati
   */
  filterVehiclesModelsDuplicates(vehicles: Vehicle[]) {
    const seenModels = new Set<string>(); // Set per tracciare i modelli unici
    return vehicles.filter(vehicle => {
      if (seenModels.has(vehicle.model)) {
        return false;
      }
      seenModels.add(vehicle.model);
      return true;
    });
  }

  public get filteredVehicles(): Vehicle[] {
    return this._filteredVehicles;
  }
  public set filteredVehicles(value: Vehicle[]) {
    this._filteredVehicles = value;
  }
}
