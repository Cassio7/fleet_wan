import { AfterViewInit, Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class KanbanGpsService{
  private _loadKanbanGps$: BehaviorSubject<string> = new BehaviorSubject<string>("");
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

  // /**
  //  * Rimuove un item da una colonna del kanban GPS
  //  * @param column colonna dalla quale rimuovere
  //  * @param item item da rimuovere
  //  */
  // removeItem(column: 'working' | 'warning' | 'error', item: string) {
  //   switch (column) {
  //     case 'working':
  //       this.workingVehicles = this.workingVehicles.filter(i => i !== item);
  //       break;
  //     case 'warning':
  //       this.warningVehicles = this.warningVehicles.filter(i => i !== item);
  //       break;
  //     case 'error':
  //       this.errorVehicles = this.errorVehicles.filter(i => i !== item);
  //       break;
  //   }
  // }



  public get loadKanbanGps$(): BehaviorSubject<string> {
    return this._loadKanbanGps$;
  }
  public set loadKanbanGps$(value: BehaviorSubject<string>) {
    this._loadKanbanGps$ = value;
  }
}
