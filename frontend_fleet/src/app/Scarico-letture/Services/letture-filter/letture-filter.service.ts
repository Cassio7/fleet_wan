import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LettureFilters{
  cantieriNames: string[],
  dateFrom: Date,
  dateTo: Date
}
@Injectable({
  providedIn: 'root'
})
export class LettureFilterService {

  private readonly _filterByLettureFilters$: BehaviorSubject<LettureFilters | null> = new BehaviorSubject<LettureFilters | null>(null);

  constructor() { }

  public get filterByLettureFilters$(): BehaviorSubject<LettureFilters | null> {
    return this._filterByLettureFilters$;
  }

}
