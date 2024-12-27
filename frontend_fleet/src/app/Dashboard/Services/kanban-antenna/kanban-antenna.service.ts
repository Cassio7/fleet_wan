import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../check-errors/check-errors.service';

@Injectable({
  providedIn: 'root'
})
export class KanbanAntennaService {
  private readonly _loadKanbanAntenna$: Subject<void> = new Subject<void>();
  private readonly _loadKanbanAntennaVehicles$: BehaviorSubject<Vehicle[]> = new BehaviorSubject<Vehicle[]>([]);


  workingVehicles: Vehicle[] = [];
  warningVehicles: Vehicle[] = [];
  errorVehicles: Vehicle[] = [];

  constructor(
    private checkErrorsService: CheckErrorsService,
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

  setKanbanData(vehicles: Vehicle[]){
    const antennaSeries = this.checkErrorsService.checkVehiclesAntennaErrors(vehicles);
    const workingVehicles: Vehicle[] = antennaSeries[0];
    const errorVehicles: Vehicle[] = antennaSeries[1];

    this.clearVehicles();

    workingVehicles.forEach(vehicle=>{
      this.addVehicle('working', vehicle);
    });
    errorVehicles.forEach(vehicle=>{
      this.addVehicle('error', vehicle);
    });
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
  public get loadKanbanAntennaVehicles$(): BehaviorSubject<Vehicle[]> {
    return this._loadKanbanAntennaVehicles$;
  }
}
