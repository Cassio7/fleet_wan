import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private _login$: Subject<void> = new Subject<void>();

  constructor() { }

  public get login$(): Subject<void> {
    return this._login$;
  }
}
