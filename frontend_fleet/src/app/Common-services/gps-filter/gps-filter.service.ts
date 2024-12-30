import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../../Dashboard/Services/check-errors/check-errors.service';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { Vehicle } from '../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class GpsFilterService {
  private _allSelected = false;

  /**
   * Trasporta le opzioni selezionate del filtro dei gps e notifica la tabella di filtrare i dati in base ai cantieri ottenuti
   */
  private readonly _filterTableByGps$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor(

  ) { }


  /**
   * Seleziona / deseleziona tutti gli stati dei gps dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllGps(): string{
    if (this.allSelected) {
      this.filterTableByGps$.next([]);
      this.allSelected = false;
      return "";
    } else {
      this._filterTableByGps$.next(["all"]);
      this.allSelected = true;
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


  public get filterTableByGps$(): BehaviorSubject<string[]> {
    return this._filterTableByGps$;
  }
  public get allSelected() {
    return this._allSelected;
  }
  public set allSelected(value) {
    this._allSelected = value;
  }
}
