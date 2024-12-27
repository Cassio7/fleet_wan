import { AfterViewInit, Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../check-errors/check-errors.service';

@Injectable({
  providedIn: 'root'
})
export class KanbanGpsService{
  private readonly _loadKanbanGps$: Subject<void> = new Subject<void>();
  workingVehicles: Vehicle[] = [];
  warningVehicles: Vehicle[] = [];
  errorVehicles: Vehicle[] = [];

  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }

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
   * Imposta i dati delle colonne del kanban
   * @param vehicles veicoli da suddividere nelle colonne
   */
  setKanbanData(vehicles: Vehicle[]){
    const series = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);//recupero dati dei veicoli controllati
    this.workingVehicles = series[0];
    this.warningVehicles = series[1];
    this.errorVehicles = series[2];
  }

  /**
   * Elimina gli elementi nel kanban gps
   */
  clearVehicles(){
    this.workingVehicles = [];
    this.warningVehicles = [];
    this.errorVehicles = [];
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



  public get loadKanbanGps$(): Subject<void> {
    return this._loadKanbanGps$;
  }
}
