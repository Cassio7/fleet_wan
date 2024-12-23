import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private _filterByPlateResearch$: BehaviorSubject<string> = new BehaviorSubject<string>("");

  private _allSelected: boolean = false;


  constructor(
  ) { }

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
  public get allSelected(): boolean {
    return this._allSelected;
  }
  public set allSelected(value: boolean) {
    this._allSelected = value;
  }
}
