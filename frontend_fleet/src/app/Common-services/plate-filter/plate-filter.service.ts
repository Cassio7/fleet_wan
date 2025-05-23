import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';
import { VehicleData } from '../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class PlateFilterService {

  private readonly _filterByPlateResearch$: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor(
  ) { }

  /**
   * Filtra i veicoli passati per parametro in base alla targa ed ad un input di ricerca su quest'ultima
   * @param research ricerca
   * @param vehicles veicoli
   * @returns veicoli filtrati
   */
  filterVehiclesByPlateResearch(
    research: string,
    vehiclesData: (VehicleData | Vehicle)[]
  ): (VehicleData | Vehicle)[] {
      const searchTextLower = research.toLowerCase().replace(/\s+/g, '');

      return vehiclesData.filter(vehicle => {
        let plate = '';

        if ('plate' in vehicle) {
          plate = vehicle.plate;
        } else if ('vehicle' in vehicle && 'plate' in vehicle.vehicle) {
          plate = vehicle.vehicle.plate;
        }

        return plate.toLowerCase().replace(/\s+/g, '').includes(searchTextLower);
      });
  }



  /**
   * Filtra i veicoli in base alle targhe dei veicoli selezionati.
   * @param selectedPlates - Array di targhe selezionate.
   * @param vehicles - Array di veicoli da filtrare.
   * @returns Un array di veicoli che corrispondono alle targhe selezionate.
   */
  filterVehiclesByPlates(selectedPlates: string[], vehicles: (VehicleData | Vehicle)[]): (VehicleData | Vehicle)[] {
    const platesSet = new Set(selectedPlates);  // Create a Set for fast lookup

    return vehicles.filter(vehicle => {
      if ('vehicle' in vehicle) {
        return platesSet.has(vehicle.vehicle.plate);  // For `Vehicle` type, access vehicle.plate
      } else if ('veId' in vehicle) {
        return platesSet.has(vehicle.plate);  // For `VehicleData` type, access plate directly
      }
      return false;  // Default return in case of unexpected structure
    });
  }

  /**
   * Seleziona/deseleziona tutte le opzioni delle targhe
   * @param selectionState stato di selezione del filtro per targhe nel componente chiamante
   * @param vehicles veicoli da ritornare in caso di seleziona tutto
   * @returns array di tutti i veicoli oppure un array vuoto
   */
  toggleAllPlatesWithVehicles(selectionState: boolean, vehicles: (Vehicle | VehicleData)[]){
    return selectionState ? [] : vehicles.map(vehicle => {
      if('vehicle' in vehicle){
        return vehicle.vehicle.plate
      }else{
        return vehicle.plate;
      }
    });
  }


  public get filterByPlateResearch$(): BehaviorSubject<string> {
    return this._filterByPlateResearch$;
  }
}
