import { Injectable } from '@angular/core';
import { selectedData } from '../select/select.service';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class MezziFilterService {

  constructor() { }

  filterVehiclesBySelections(selectedData: selectedData, vehicles: Vehicle[]): Vehicle[] {
    // Filtra i veicoli per targa
    const plateFilteredVehicles = this.filterVehiclesByPlates(selectedData.plates, vehicles);
    // Filtra i veicoli per modello
    const modelFilteredVehicles = this.filterVehiclesByModels(selectedData.modelli, plateFilteredVehicles);

    return modelFilteredVehicles; //ritorna i veicoli dove sono stati applicati tutti i filtri
  }

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
    if (!selectedModels.length) return vehicles; // Return all vehicles if no models are selected.
    const modelsSet = new Set(selectedModels); // Using a Set for fast lookup.
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
      // Se il modello è già stato aggiunto al Set, lo saltiamo
      if (seenModels.has(vehicle.model)) {
        return false;
      }
      // Se il modello non è presente, lo aggiungiamo al Set e includiamo il veicolo
      seenModels.add(vehicle.model);
      return true;
    });
  }



}
