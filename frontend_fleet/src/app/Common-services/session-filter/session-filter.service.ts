import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionFilterService {
  private _allOptions: string[] = ["Funzionante", "Errore", "Nessuna sessione"];
  private _selectedOptions: string[] = [];
  private _allSelected = false;

  /**
   * Trasporta le opzioni selezionate del filtro dei gps e notifica la tabella di filtrare i dati in base ai cantieri ottenuti
   */
  private readonly _filterTableBySessionStates$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor(

  ) { }


  /**
   * Seleziona / deseleziona tutti gli stati dei gps dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllSessionsStates(): string{
    if (this.allSelected) {
      this._filterTableBySessionStates$.next([]);
      this.selectedOptions = this.allOptions;
      this.allSelected = false;
      return "";
    } else {
      this._filterTableBySessionStates$.next(["all"]);
      this.selectedOptions = [];
      this.allSelected = true;
      return "all";
    }
  }

  /**
   * controlla se sono selezionati tutti gli stati gps
   * @returns true se è tutto selezionato
   * @returns false se non è tutto selezionato
   */
  isSessionFilterAllSelected(): boolean{
    return this.allSelected;
  }

  /**
   * Seleziona / deseleziona tutti gli stati dei gps dei veicoli nel select e notifica la tabella di aggiornare i dati
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
