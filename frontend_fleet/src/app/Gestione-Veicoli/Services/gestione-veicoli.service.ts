import { Injectable, signal, WritableSignal } from '@angular/core';

export interface gestioneVeicoliFilters{
  targa: string,
  cantieri: string[],
  societa: string[]
}
@Injectable({
  providedIn: 'root'
})
export class GestioneVeicoliService {
  private readonly _gestioneVeicoliFilters: WritableSignal<gestioneVeicoliFilters | null> = signal(null);

  constructor() { }

  public get gestioneVeicoliFilters(): WritableSignal<gestioneVeicoliFilters | null> {
    return this._gestioneVeicoliFilters;
  }
}
