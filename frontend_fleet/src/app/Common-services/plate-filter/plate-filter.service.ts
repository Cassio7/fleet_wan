import { Injectable } from '@angular/core';
import { Vehicle } from '../../Models/Vehicle';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlateFilterService {

  private readonly _filterByPlateResearch$: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor() { }

  /**
   * Filtra i veicoli passati per parametro in base alla targa ed ad un input di ricerca su quest'ultima
   * @param research ricerca
   * @param vehicles veicoli
   * @returns veicoli filtrati
   */
  filterVehiclesByPlateResearch(research: string, vehicles: Vehicle[]) {
    const searchTextLower = research.toLowerCase();//ricerca minuscolo

    //filtro veicoli in base a ricerca
    const filteredVehicles = vehicles.filter(vehicle =>
      vehicle.plate.toLowerCase().includes(searchTextLower)
    );

    return filteredVehicles;
  }

  public get filterByPlateResearch$(): BehaviorSubject<string> {
    return this._filterByPlateResearch$;
  }
}
