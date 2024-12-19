import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KanbanGpsService {
  private _loadKanbanGps$: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor() { }

  public get loadKanbanGps$(): BehaviorSubject<string> {
    return this._loadKanbanGps$;
  }
  public set loadKanbanGps$(value: BehaviorSubject<string>) {
    this._loadKanbanGps$ = value;
  }
}
