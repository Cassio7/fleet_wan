import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private _login$: Subject<void> = new Subject<void>();

  private _isLogged: boolean = false;

  constructor() { }

  public get login$(): Subject<void> {
    return this._login$;
  }
  public get isLogged(): boolean {
    return this._isLogged;
  }
  public set isLogged(value: boolean) {
    this._isLogged = value;
  }
}
