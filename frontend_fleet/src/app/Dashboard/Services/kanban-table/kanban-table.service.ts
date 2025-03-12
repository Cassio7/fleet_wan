import { Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Subject } from 'rxjs';
import { Filters } from '../../../Common-services/filters-common/filters-common.service';

@Injectable({
  providedIn: 'root'
})
export class KanbanTableService {
  private readonly _tableLoaded$: Subject<void> = new Subject<void>();
  private readonly _loadKabanTable$: Subject<void> = new Subject<void>();

  private _filtersValue: WritableSignal<Filters | null> = signal(null);

  constructor() { }

  public get tableLoaded$(): Subject<void> {
    return this._tableLoaded$;
  }
  public get loadKabanTable$(): Subject<void> {
    return this._loadKabanTable$;
  }
  public get filtersValue(): WritableSignal<Filters | null> {
    return this._filtersValue;
  }
  public set filtersValue(value: WritableSignal<Filters | null>) {
    this._filtersValue = value;
  }
}
