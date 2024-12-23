import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../../Dashboard/Services/check-errors/check-errors.service';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { Vehicle } from '../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class GpsFilterService {
  private readonly _updateCantieriFilterOptions$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private _allSelected = false;

  /**
   * Trasporta le opzioni selezionate del filtro dei gps e notifica la tabella di filtrare i dati in base ai cantieri ottenuti
   */
  private readonly _filterTableByGps$: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor(
    private checkErrorsService: CheckErrorsService,
    private sessionStorageService: SessionStorageService
  ) { }


  /**
   * Seleziona / deseleziona tutti gli stati dei gps dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllGps(): string{
    if (this.allSelected) {
      this.filterTableByGps$.next("");
      this.allSelected = false;
      return "";
    } else {
      this._filterTableByGps$.next("all");
      this.allSelected = true;
      return "all";
    }
  }


  public get filterTableByGps$(): BehaviorSubject<string> {
    return this._filterTableByGps$;
  }
  public get updateCantieriFilterOptions$(): BehaviorSubject<any[]> {
    return this._updateCantieriFilterOptions$;
  }
  public get allSelected() {
    return this._allSelected;
  }
  public set allSelected(value) {
    this._allSelected = value;
  }
}
