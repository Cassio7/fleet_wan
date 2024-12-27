import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class KanbanAntennaService {
private readonly _loadKanbanAntenna$: Subject<void> = new Subject<void>();
  workingVehicles: Vehicle[] = [];
  warningVehicles: Vehicle[] = [];
  errorVehicles: Vehicle[] = [];

  constructor() { }

  /**
   * Aggiunge un item ad una colonna del kanban GPS
   * @param column colonna sulla quale aggiungere
   */
  addVehicle(column: 'working' | 'warning' | 'error', vehicle: Vehicle) {
    switch (column) {
      case 'working':
        this.workingVehicles.push(vehicle);
        break;
      case 'warning':
        this.warningVehicles.push(vehicle);
        break;
      case 'error':
        this.errorVehicles.push(vehicle);
        break;
    }
  }

  /**
   * Elimina gli elementi nel kanban gps
   */
  clearVehicles(){
    this.workingVehicles = [];
    this.warningVehicles = [];
    this.errorVehicles = [];
  }

  public get loadKanbanAntenna$(): Subject<void> {
    return this._loadKanbanAntenna$;
  }
}
