import { PlateFilterService } from './../../../Common-services/plate-filter/plate-filter.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { FormControl } from '@angular/forms';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';

export interface MezziFilters{
  plate: string;
  cantieri: FormControl<string[] | null>;
}
@Injectable({
  providedIn: 'root'
})
export class MezziFiltersService {
  //subject per notificare di filtrare la tabella con i veicoli passati
  private readonly _filterTable$: BehaviorSubject<Vehicle[]> = new BehaviorSubject<Vehicle[]>([]);

  private _mezziFilters: MezziFilters = {
    plate: "",
    cantieri: new FormControl<string[]>([])
  };

  constructor(
    private plateFilterService: PlateFilterService,
    private sessionStorageService: SessionStorageService,
    private cantieriFilterService: CantieriFilterService
  ) { }

  filterVehicles(vehicles: Vehicle[]): Vehicle[]{
    let mainVehicles: Vehicle[] = [];
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));

    if(this.mezziFilters.plate){
      mainVehicles = this.plateFilterService.filterVehiclesByPlateResearch(this.mezziFilters.plate, vehicles) as Vehicle[];
    }else{
      mainVehicles = allVehicles;
    }
    if(this.mezziFilters.cantieri.value){
      mainVehicles = this.cantieriFilterService.filterVehiclesByCantieri(mainVehicles, this.mezziFilters.cantieri.value) as Vehicle[];
    }

    return mainVehicles;
  }


  public get filterTable$(): BehaviorSubject<Vehicle[]> {
    return this._filterTable$;
  }
  public get mezziFilters(): MezziFilters {
    return this._mezziFilters;
  }
  public set mezziFilters(value: MezziFilters) {
    this._mezziFilters = value;
  }
}
