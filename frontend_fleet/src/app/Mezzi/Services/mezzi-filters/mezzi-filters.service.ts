import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class MezziFiltersService {
  private readonly _filterTable$: BehaviorSubject<Vehicle[]> = new BehaviorSubject<Vehicle[]>([]);

  constructor() { }

  public get filterTable$(): BehaviorSubject<Vehicle[]> {
    return this._filterTable$;
  }
}
