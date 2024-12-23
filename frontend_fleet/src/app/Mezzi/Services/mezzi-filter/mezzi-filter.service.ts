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
    if (!selectedPlates.length) return vehicles;
    const platesSet = new Set(selectedPlates);
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
   * Filtra i first event duplicati
   * @param vehicles veicoli dai quali prendere i first event
   * @returns array di veicoli filtrati
   */
  filterFirstEventsDuplicates(vehicles: Vehicle[]) {
    const seenFirstEvents = new Set<string>();
    return vehicles.filter(vehicle => {
      if (vehicle.firstEvent) {
        let date: Date;

        if (vehicle.firstEvent instanceof Date) {
          date = vehicle.firstEvent;
        } else {
          date = new Date(vehicle.firstEvent);
        }

        if (isNaN(date.getTime())) {
          return false;
        }

        const dateString = date.toISOString().split('T')[0];
        if (seenFirstEvents.has(dateString)) {
          return false;
        }
        seenFirstEvents.add(dateString);
        return true;
      } else {
        return false;
      }
    });
  }



}
