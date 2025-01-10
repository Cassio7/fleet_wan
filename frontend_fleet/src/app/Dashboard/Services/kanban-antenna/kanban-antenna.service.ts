import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { VehicleData } from '../../../Models/VehicleData';
import { BlackboxGraphsService } from '../blackbox-graphs/blackbox-graphs.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';

@Injectable({
  providedIn: 'root'
})
export class KanbanAntennaService {
  private readonly _loadKanbanAntenna$: Subject<void> = new Subject<void>();
  private readonly _loadKanbanAntennaVehicles$: BehaviorSubject<VehicleData[]> = new BehaviorSubject<VehicleData[]>([]);


  workingVehicles: VehicleData[] = [];
  errorVehicles: VehicleData[] = [];
  blackboxVehicles: VehicleData[] = [];

  constructor(
    private checkErrorsService: CheckErrorsService,
    private blackboxGraphService: BlackboxGraphsService
  ) { }


  /**
   * Permette di ottenere tutti i veicoli di tutte le colonne del kanban gps
   * @returns array di veicoli così formato: [prima colonna, seconda colonna, terza colonna]
   */
  getAllKanbanVehicles(){
    return [...this.workingVehicles, ...this.errorVehicles, ...this.blackboxVehicles];
  }

  /**
   * Aggiunge un item ad una colonna del kanban GPS
   * @param column colonna sulla quale aggiungere
   */
  addVehicle(column: 'working' | 'error' | 'blackbox', vehicle: VehicleData) {
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
  setKanbanData(vehicles: VehicleData[]){
    const antennaSeries = this.checkErrorsService.checkVehiclesAntennaErrors(vehicles);
    this.workingVehicles = antennaSeries[0];
    this.errorVehicles = antennaSeries[1];
    this.blackboxVehicles = this.blackboxGraphService.getAllRFIDVehicles(vehicles).blackboxOnly;
  }

  /**
   * Calcola la percentuale dei veicoli passati in base al totale dei mezzi nel kanaban
   * @returns risultato del calcolo
   */
  getVehiclesPercentage(vehicles: VehicleData[]){
    const calc = this.getAllKanbanVehicles().length ? (vehicles.length / this.getAllKanbanVehicles().length * 100) : 0;
    return calc;
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
  public get loadKanbanAntennaVehicles$(): BehaviorSubject<VehicleData[]> {
    return this._loadKanbanAntennaVehicles$;
  }
}
