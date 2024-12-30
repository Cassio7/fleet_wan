import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../../Dashboard/Services/check-errors/check-errors.service';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { Vehicle } from '../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class GpsFilterService {
  private _allOptions: string[] = ["Funzionante", "Warning", "Error"];
  private _selectedOptions: string[] = [];
  private _allSelected = false;

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
  toggleSelectAllGps(): string{
    if (this.allSelected) {
      this.filterTableByGps$.next([]);
      this.allSelected = false;
      this.selectedOptions = [];
      return "";
    } else {
      this._filterTableByGps$.next(["all"]);
      this.allSelected = true;
      this.selectedOptions = this.allOptions;
      return "all";
    }
  }

  /**
   * controlla se sono selezionati tutti gli stati gps
   * @returns true se è tutto selezionato
   * @returns false se non è tutto selezionato
   */
  isGpsFilterAllSelected(): boolean{
    return this.allSelected;
  }

  /**
   * Aggiorna le opzioni selezionate
   * @param vehicles veicoli da analizzare
   * @returns array di opzioni selezionate
   */
  updateSelectedOptions(vehicles: Vehicle[]){
    const gpsCheck = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);

    console.log("gpsCheck: ", gpsCheck);
    if(gpsCheck[0].length>0){
      this.selectedOptions.push("Funzionante");
      console.log("pushato funzionante");
    }
    if(gpsCheck[1].length>0){
      this.selectedOptions.push("Warning");
      console.log("pushato warning");
    }
    if(gpsCheck[2].length>0){
      this.selectedOptions.push("Errore");
      console.log("pushato errore");
    }

    if(JSON.stringify(this.selectedOptions) == JSON.stringify(["Funzionante", "Warning", "Errore"])){
      this.selectedOptions.push("Seleziona tutto");
    }

    return this.selectedOptions;
  }

  public get updateGpsFilterOptions$(): BehaviorSubject<string[]> {
    return this._updateGpsFilterOptions$;
  }
  public get filterTableByGps$(): BehaviorSubject<string[]> {
    return this._filterTableByGps$;
  }
  public get allSelected() {
    return this._allSelected;
  }
  public set allSelected(value) {
    this._allSelected = value;
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
