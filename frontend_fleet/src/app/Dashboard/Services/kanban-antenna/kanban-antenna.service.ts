import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { BlackboxGraphsService } from '../blackbox-graphs/blackbox-graphs.service';

@Injectable({
  providedIn: 'root'
})
export class KanbanAntennaService {
  private readonly _loadKanbanAntenna$: Subject<void> = new Subject<void>();
  private readonly _loadKanbanAntennaVehicles$: BehaviorSubject<Vehicle[]> = new BehaviorSubject<Vehicle[]>([]);


  workingVehicles: Vehicle[] = [];
  blackboxVehicles: Vehicle[] = [];
  errorVehicles: Vehicle[] = [];

  constructor(
    private checkErrorsService: CheckErrorsService,
    private blackboxGraphService: BlackboxGraphsService
  ) { }

  /**
   * Aggiunge un item ad una colonna del kanban GPS
   * @param column colonna sulla quale aggiungere
   */
  addVehicle(column: 'working' | 'error' | 'blackbox', vehicle: Vehicle) {
    switch (column) {
      case 'working':
        this.workingVehicles.push(vehicle);
        break;
      case 'error':
        this.errorVehicles.push(vehicle);
        break;
      case 'blackbox':
        this.blackboxVehicles.push(vehicle);
        break;
    }
  }

  /**
   * Imposta i dati delle colonne del kanban delle antenne
   * @param vehicles elementi con cui riempire le colonne
   */
  setKanbanData(vehicles: Vehicle[]){
    const antennaSeries = this.checkErrorsService.checkVehiclesAntennaErrors(vehicles);
    this.workingVehicles = antennaSeries[0];
    this.errorVehicles = antennaSeries[1];
    this.blackboxVehicles = this.blackboxGraphService.getAllRFIDVehicles(vehicles).blackboxOnly;
  }

  /**
   * Elimina gli elementi nel kanban gps
   */
  clearVehicles(){
    this.workingVehicles = [];
    this.blackboxVehicles = [];
    this.errorVehicles = [];
  }

  public get loadKanbanAntenna$(): Subject<void> {
    return this._loadKanbanAntenna$;
  }
  public get loadKanbanAntennaVehicles$(): BehaviorSubject<Vehicle[]> {
    return this._loadKanbanAntennaVehicles$;
  }
}
