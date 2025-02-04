import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VehicleData } from '../../Models/VehicleData';
import { CheckErrorsService } from '../check-errors/check-errors.service';

@Injectable({
  providedIn: 'root'
})
export class GpsFilterService {
  private _allOptions: string[] = ["Funzionante", "Warning", "Errore"];
  private _selectedOptions: string[] = [];

  /**
   * Trasporta le opzioni selezionate del filtro dei gps e notifica la tabella di filtrare i dati in base ai cantieri ottenuti
   */
  private readonly _updateGpsFilterOptions$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private readonly _filterTableByGps$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }


  /**
   * Seleziona / deseleziona tutti gli stati dei gps dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllGps(selectionState: boolean): boolean{
    if (selectionState) {
      this.filterTableByGps$.next([]);
      selectionState = false;
      this.selectedOptions = [];
    } else {
      this._filterTableByGps$.next(["all"]);
      selectionState = true;
      this.selectedOptions = this.allOptions;
    }
    return selectionState;
  }

  /**
   * Aggiorna le opzioni selezionate
   * @param vehicles veicoli da analizzare
   * @returns array di opzioni selezionate
   */
  updateSelectedOptions(vehicles: VehicleData[]){
    this.selectedOptions = [];
    const gpsCheck = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);
    if(gpsCheck[0].length>0){
      this.selectedOptions.push("Funzionante");
    }
    if(gpsCheck[1].length>0){
      this.selectedOptions.push("Warning");
    }
    if(gpsCheck[2].length>0){
      this.selectedOptions.push("Errore");
    }

    if(JSON.stringify(this.selectedOptions) == JSON.stringify(this.allOptions)){
      this.selectedOptions.push("Seleziona tutto");
    }else{
    }

    this.updateGpsFilterOptions$.next(this.selectedOptions);

    return this.selectedOptions;
  }

  public get updateGpsFilterOptions$(): BehaviorSubject<string[]> {
    return this._updateGpsFilterOptions$;
  }
  public get filterTableByGps$(): BehaviorSubject<string[]> {
    return this._filterTableByGps$;
  }
  public get selectedOptions(): string[] {
    return this._selectedOptions;
  }
  public set selectedOptions(value: string[]) {
    this._selectedOptions = value;
  }
  public get allOptions(): string[] {
    return this._allOptions;
  }
  public set allOptions(value: string[]) {
    this._allOptions = value;
  }
}
