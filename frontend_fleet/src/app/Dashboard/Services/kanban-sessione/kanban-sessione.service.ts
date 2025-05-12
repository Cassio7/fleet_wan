import { Injectable } from '@angular/core';
import { VehicleData } from '../../../Models/VehicleData';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { Subject } from 'rxjs';

export interface SessionErrorVehicles {
  nullVehicles: VehicleData[];
  stuckVehicles: VehicleData[];
  powerVehicles: VehicleData[];
}

@Injectable({
  providedIn: 'root'
})
export class KanbanSessioneService {
  private readonly _loadKanbanSessione$: Subject<void> = new Subject<void>();

  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }

  private _allSelected: boolean = false;

  // per gestire la disabilitazione delle chips nel kanban
  errorVehicles: SessionErrorVehicles = {
    nullVehicles: [],
    stuckVehicles: [],
    powerVehicles: []
  };

  workingVehicles: VehicleData[] = [];




  /**
   * Permette di gestire la selezione e deselezione di tutti i veicoli tramite il pulsante "Seleziona tutto"
   * all'interno del filtro per cantieri del kanban gps
   */
  toggleSelectAllKanbanVehicles(){
    if(this.allSelected){
      this.allSelected = false;
    }else{
      this.allSelected = true;
    }
    return this.allSelected;
  }

  filterVehiclesBySelectedAnomalyTypes(vehicles: VehicleData[], selectedAnomalies: string[]): VehicleData[] {
    const vehicleAnomalies = this.checkErrorsService.getVehiclesSessionAnomalyTypes(vehicles);
    let kanbanVehicles: VehicleData[] = [];

    if (selectedAnomalies.includes("Nulla")) {
      kanbanVehicles = kanbanVehicles.concat(vehicleAnomalies.nullVehicles);
    }
    if (selectedAnomalies.includes("Bloccata")) {
      kanbanVehicles = kanbanVehicles.concat(vehicleAnomalies.stuckVehicles);
    }
    if (selectedAnomalies.includes("Alimentazione")) {
      kanbanVehicles = kanbanVehicles.concat(vehicleAnomalies.powerVehicles);
    }

    return kanbanVehicles;
  }

  setKanbanData(vehicles: VehicleData[]){
    this.clearVehicles();
    const series = this.checkErrorsService.checkVehiclesSessionErrors(vehicles);//recupero dati dei veicoli controllati
    this.workingVehicles = series[0];
    series[1].map(vehicle => this.addVehicle('error', vehicle));
  }

  /**
   * Aggiunge un item ad una colonna del kanban GPS
   * @param column colonna sulla quale aggiungere
   */
  private addVehicle(column: 'working' | 'error', vehicle: VehicleData) {
    switch (column) {
      case 'working':
        this.workingVehicles.push(vehicle);
        break;
      case 'error':
        this.addErrorVehicle(vehicle);
        break;
    }
  }

  private clearVehicles(){
    this.workingVehicles = [];
    this.clearErrorVehicles();
  }

  private clearErrorVehicles(){
    this.errorVehicles = {
      nullVehicles: [],
      stuckVehicles: [],
      powerVehicles: []
    }
  }

  private addErrorVehicle(vehicle: VehicleData){
    const anomalyType = this.checkErrorsService.getVehicleSessionAnomalyType(vehicle);

    if (anomalyType === "Nulla") {
      this.errorVehicles.nullVehicles.push(vehicle);
    } else if (anomalyType === "Bloccata") {
      this.errorVehicles.stuckVehicles.push(vehicle);
    } else if (anomalyType === "Alimentazione") {
      this.errorVehicles.powerVehicles.push(vehicle);
    }
  }

  getAllErrorVehicles(){
    return [...this.errorVehicles.nullVehicles, ...this.errorVehicles.stuckVehicles, ... this.errorVehicles.powerVehicles];
  }

  public get allSelected(): boolean {
    return this._allSelected;
  }
  public set allSelected(value: boolean) {
    this._allSelected = value;
  }
  public get loadKanbanSessione$(): Subject<void> {
    return this._loadKanbanSessione$;
  }
}
