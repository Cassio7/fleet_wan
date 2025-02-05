import { Injectable } from '@angular/core';
import { VehicleData } from '../../../Models/VehicleData';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KanbanSessioneService {
  private readonly _loadKanbanSessione$: Subject<void> = new Subject<void>();

  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }

  private _allSelected: boolean = false;
  private _workingVehicles: VehicleData[] = [];
  private _errorVehicles: VehicleData[] = [];

  /**
     * Permette di ottenere tutti i veicoli di tutte le colonne del kanban gps
     * @returns array di veicoli così formato: [prima colonna, seconda colonna, terza colonna]
     */
  getAllKanbanVehicles(){
    return [...this.workingVehicles, ...this.errorVehicles];
  }

  /**
   * Aggiunge un item ad una colonna del kanban GPS
   * @param column colonna sulla quale aggiungere
   */
  addVehicle(column: 'working' | 'warning' | 'error', vehicle: VehicleData) {
    switch (column) {
      case 'working':
        this.workingVehicles.push(vehicle);
        break;
      case 'error':
        this.errorVehicles.push(vehicle);
        break;
    }
  }

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

  /**
   * Imposta i dati delle colonne del kanban
   * @param vehicles elementi con cui riempire le colonne
   */
  setKanbanData(vehicles: VehicleData[]){
    const series = this.checkErrorsService.checkVehiclesSessionErrors(vehicles);//recupero dati dei veicoli controllati
    this.workingVehicles = series[0];
    this.errorVehicles = series[1];
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
    this.errorVehicles = [];
  }

  public get allSelected(): boolean {
    return this._allSelected;
  }
  public set allSelected(value: boolean) {
    this._allSelected = value;
  }
  public get workingVehicles(): VehicleData[] {
    return this._workingVehicles;
  }
  public set workingVehicles(value: VehicleData[]) {
    this._workingVehicles = value;
  }
  public get errorVehicles(): VehicleData[] {
    return this._errorVehicles;
  }
  public set errorVehicles(value: VehicleData[]) {
    this._errorVehicles = value;
  }
  public get loadKanbanSessione$(): Subject<void> {
    return this._loadKanbanSessione$;
  }
}
