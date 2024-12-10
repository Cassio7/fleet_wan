import { Injectable } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class MezziFilterService {
  constructor() { }


  /**
   * Filtra i veicoli in base alle targhe dei veicoli selezionati.
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
   * Filtra i veicoli in base ai modelli dei veicoli selezionati.
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
   * Filtra i veicoli in base ai cantieri dei veicoli selezionati.
   * @param selectedModels - Array di cantieri selezionati.
   * @param vehicles - Array di veicoli da filtrare.
   * @returns Un array di veicoli che corrispondono ai cantieri selezionati.
   */
  filterVehiclesByCantiere(selectedCantieri: string[], vehicles: Vehicle[]): Vehicle[] {
    if (!selectedCantieri || !selectedCantieri.length) {
      return vehicles; // Return all vehicles if no cantieri are selected.
    }

    const modelsSet = new Set(selectedCantieri);

    return vehicles.filter(vehicle => {
      const worksiteName = vehicle.worksite?.name;
      return worksiteName ? modelsSet.has(worksiteName) : false;
    });
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

  /**
   * Filtra i cantieri duplicati
   * @param vehicles veicoli dai quali prendere i modelli
   * @returns array di veicoli filtrati
   */
  filterVehiclesCantieriDuplicates(vehicles: Vehicle[]) {
    const seenCantieri = new Set<string>(); // Set per tracciare i cantieri unici
    return vehicles.filter(vehicle => {
      if (vehicle.worksite) {
        if (seenCantieri.has(vehicle.worksite.name)) {
          return false; // Duplicato trovato, non includerlo
        }
        seenCantieri.add(vehicle.worksite.name); // Aggiungi il nome del worksite al set
        return true; // Aggiungi il veicolo se il worksite non è stato visto
      } else {
        // Se il worksite è null o undefined, usa "non assegnato"
        if (seenCantieri.has("non assegnato")) {
          return false; // "non assegnato" già presente, non aggiungere il veicolo
        }
        seenCantieri.add("non assegnato"); // Aggiungi "non assegnato" al set
        return true; // Aggiungi il veicolo senza worksite
      }
    });
  }
}
