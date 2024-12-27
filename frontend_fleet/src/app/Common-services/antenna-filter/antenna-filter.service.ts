import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AntennaFilterService {
private readonly _filterTableByAntenna$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private _allSelected: boolean = false;

  constructor() { }

  /**
   * Seleziona / deseleziona tutti gli stati dei gps dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllAntenne(): string{
    if (this.allSelected) {
      this.filterTableByAntenna$.next([]);
      this.allSelected = false;
      return "";
    } else {
      this.filterTableByAntenna$.next(["all"]);
      this.allSelected = true;
      return "all";
    }
  }

  public get allSelected(): boolean {
    return this._allSelected;
  }
  public set allSelected(value: boolean) {
    this._allSelected = value;
  }
  public get filterTableByAntenna$(): BehaviorSubject<string[]> {
    return this._filterTableByAntenna$;
  }
}
