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
  filterVehiclesModelsDuplicates(vehicles: (Vehicle | VehicleData)[]) {
    const seenModels = new Set<string>(); // Set per tracciare i modelli unici
    return vehicles.filter(vehicle => {
      // Determina se l'oggetto è di tipo VehicleData o Vehicle e ottiene il modello corrispondente
      const model = 'vehicle' in vehicle ? vehicle.vehicle.model : vehicle.model;

      if (seenModels.has(model)) {
        return false; // Se il modello è già stato visto, escludi il veicolo
      }
      seenModels.add(model); // Aggiungi il modello al set dei modelli visti
      return true; // Includi il veicolo nell'array filtrato
    });
  }
}
