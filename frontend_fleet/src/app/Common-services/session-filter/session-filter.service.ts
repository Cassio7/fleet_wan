import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { VehicleData } from '../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class SessionFilterService {
  private _allOptions: string[] = ["Funzionante", "Errore"];
  private _selectedOptions: string[] = [];
  private _allSelected = false;

  /**
   * Trasporta le opzioni selezionate del filtro della sessione e notifica la tabella di filtrare i dati in base ai cantieri ottenuti
   */
  private readonly _filterTableBySessionStates$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private readonly _updateSessionOptions$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);


  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }


  /**
   * Seleziona / deseleziona tutti gli stati della sessione dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllSessionsStates(): boolean{
    if (this.allSelected) {
      this._filterTableBySessionStates$.next([]);
      this.selectedOptions = this.allOptions;
      this.allSelected = false;
    } else {
      this._filterTableBySessionStates$.next(["all"]);
      this.selectedOptions = [];
      this.allSelected = true;
    }
    return this.allSelected;
  }

  /**
   * controlla se sono selezionati tutti gli stati delle sessioni
   * @returns true se è tutto selezionato
   * @returns false se non è tutto selezionato
   */
  isSessionFilterAllSelected(): boolean{
    return this.allSelected;
  }

  /**
   * Seleziona / deseleziona tutti gli stati delle sessioni dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllSessionStates(): string{
    if (this.allSelected) {
      this.filterTableBySessionStates$.next([]);
      this.allSelected = false;
      return "";
    } else {
      this.filterTableBySessionStates$.next(["all"]);
      this.allSelected = true;
      return "all";
    }
  }

  updateSelectedOptions(vehicles: VehicleData[]){
    this.selectedOptions = [];
    const sessionErrorsCheck = this.checkErrorsService.checkVehiclesSessionErrors(vehicles);

    if(sessionErrorsCheck[0].length>0){
      this.selectedOptions.push("Funzionante");
    }
    if(sessionErrorsCheck[1].length>0){
      this.selectedOptions.push("Errore");
    }

    if(JSON.stringify(this.selectedOptions) == JSON.stringify(this.allOptions)){
      this.selectedOptions.push("Seleziona tutto");
      this.allSelected = true;
    }else{
      this.allSelected = false;
    }

    this.updateSessionOptions$.next(this.selectedOptions);

    return this.selectedOptions;
  }

  public get updateSessionOptions$(): BehaviorSubject<string[]> {
    return this._updateSessionOptions$;
  }
  public get allOptions(): string[] {
    return this._allOptions;
  }
  public set allOptions(value: string[]) {
    this._allOptions = value;
  }
  public get selectedOptions(): string[] {
    return this._selectedOptions;
  }
  public set selectedOptions(value: string[]) {
    this._selectedOptions = value;
  }
  public get filterTableBySessionStates$(): BehaviorSubject<string[]> {
    return this._filterTableBySessionStates$;
  }
  public get allSelected() {
    return this._allSelected;
  }
  public set allSelected(value) {
    this._allSelected = value;
  }
}
