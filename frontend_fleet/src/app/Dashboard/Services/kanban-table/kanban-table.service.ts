import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class KanbanTableService {
  private readonly _loadKabanTable$: Subject<void> = new Subject<void>();

  constructor() { }

  public get loadKabanTable$(): Subject<void> {
    return this._loadKabanTable$;
  }
}
