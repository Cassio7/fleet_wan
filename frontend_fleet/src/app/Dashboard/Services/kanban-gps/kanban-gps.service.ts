import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { VehicleData } from '../../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class KanbanGpsService{
  private readonly _loadKanbanGps$: Subject<void> = new Subject<void>();
  private _allSelected: boolean = false;
  private _workingVehicles: VehicleData[] = [];
  private _warningVehicles: VehicleData[] = [];
  private _errorVehicles: VehicleData[] = [];

  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }

  /**
   * Permette di ottenere tutti i veicoli di tutte le colonne del kanban gps
   * @returns array di veicoli così formato: [prima colonna, seconda colonna, terza colonna]
   */
  getAllKanbanVehicles(){
    return [...this.workingVehicles, ...this.warningVehicles, ...this.errorVehicles];
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
      case 'warning':
        this.warningVehicles.push(vehicle);
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
    const series = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);//recupero dati dei veicoli controllati
    this.workingVehicles = series[0];
    this.warningVehicles = series[1];
    this.errorVehicles = series[2];
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
  public get warningVehicles(): VehicleData[] {
    return this._warningVehicles;
  }
  public set warningVehicles(value: VehicleData[]) {
    this._warningVehicles = value;
  }
  public get errorVehicles(): VehicleData[] {
    return this._errorVehicles;
  }
  public set errorVehicles(value: VehicleData[]) {
    this._errorVehicles = value;
  }
}
