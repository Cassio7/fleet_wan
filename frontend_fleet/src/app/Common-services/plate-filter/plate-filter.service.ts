import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VehicleData } from '../../Models/VehicleData';
import { Vehicle } from '../../Models/Vehicle';
import { SessionStorageService } from '../sessionStorage/session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class PlateFilterService {

  private readonly _filterByPlateResearch$: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor(
    private sessionStorageService: SessionStorageService
  ) { }

  /**
   * Filtra i veicoli passati per parametro in base alla targa ed ad un input di ricerca su quest'ultima
   * @param research ricerca
   * @param vehicles veicoli
   * @returns veicoli filtrati
   */
  filterVehiclesByPlateResearch(research: string, vehiclesData: (VehicleData | Vehicle)[]): (VehicleData | Vehicle)[] {
    const searchTextLower = research.toLowerCase().replace(/\s+/g, '');

    let plate = '';

    return vehiclesData.filter(vehicle => {
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
  filterVehiclesByPlates(selectedPlates: string[], vehiclesData: VehicleData[]): VehicleData[] {
    if (!selectedPlates.length) return vehiclesData;
    const platesSet = new Set(selectedPlates);
    return vehiclesData.filter(obj => platesSet.has(obj.vehicle.plate));
  }


  public get filterByPlateResearch$(): BehaviorSubject<string> {
    return this._filterByPlateResearch$;
  }
}
