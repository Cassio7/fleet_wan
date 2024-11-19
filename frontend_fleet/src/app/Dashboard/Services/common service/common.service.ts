import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private _notifySidebar$: Subject<void> = new Subject();

  constructor() { }

  public get notifySidebar$(): Subject<void> {
    return this._notifySidebar$;
  }
  public set notifySidebar$(value: Subject<void>) {
    this._notifySidebar$ = value;
  }

}
