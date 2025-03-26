import { Injectable, signal, WritableSignal } from '@angular/core';
import { Vehicle } from '../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class GestioneVeicoliService {
  targaFilter: WritableSignal<string> = signal<string>("");

  constructor() { }
}
