import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
  filterVehiclesByPlateResearch(research: string, vehiclesData: VehicleData[]): VehicleData[] {
    const searchTextLower = research.toLowerCase().replace(/\s+/g, '');
    return vehiclesData.filter(obj =>
      obj.vehicle.plate.toLowerCase().replace(/\s+/g, '').includes(searchTextLower)
    );
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
