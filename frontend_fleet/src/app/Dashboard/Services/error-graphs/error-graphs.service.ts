import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { SessionStorageService } from '../../../Common services/sessionStorage/session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorGraphsService{
  private _loadGraphData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadFunzionanteData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadWarningData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadErrorData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private _series = [0,0,0];//[funzionante, warning, error]
  private _colors = ["#46ff00", "#ffd607", "#ff0000"];

  private _workingVehicles: any[] = [];
  private _warningVehicles: any[] = [];
  private _errorVehicles: any[] = [];

  private _errorSliceSelected: string = "";

  private firstLoad = true;

  constructor(
    private checkErrorsService: CheckErrorsService,
    private sessionStorageService: SessionStorageService
  ) { }

  /**
  * Permette di preparare l'array per riempire il grafico degli errori
  * e notifica e manda i dati al grafico tramite un subject
  * @param vehicles oggetto custom di veicoli
  */
  public loadChartData(vehicles: any[]) {
    this.workingVehicles = [];
    this.warningVehicles = [];
    this.errorVehicles = [];

    this._series = [0,0,0];
    for (const vehicle of vehicles) {
      //controllo errori sul veicolo corrente
      const hasGpsError = this.checkErrorsService.checkGpsError(vehicle);
      const hasSessionError = this.checkErrorsService.checkSessionError(vehicle);
      const hasAntennaError = this.checkErrorsService.checkAntennaError(vehicle);

      // Nessun errore (funzionante)
      if (!hasGpsError && !hasSessionError && !hasAntennaError) {
        this.workingVehicles.push(vehicle);
        this._series[0] += 1;
      // Errore GPS (warning)
      } else if (hasGpsError && !hasSessionError && !hasAntennaError) {
        this.warningVehicles.push(vehicle);
        this._series[1] += 1;
      // Errori (sessione, antenna o entrambi)
      } else {
        this.errorVehicles.push(vehicle);
        this._series[2] += 1;
      }
    }

    //impostazione veicoli dell'error graph in sessionstorage solo la prima volta che viene caricato
    if(this.firstLoad){
      this.sessionStorageService.setItem("workingVehicles", JSON.stringify(this.workingVehicles));
      this.sessionStorageService.setItem("warningVehicles", JSON.stringify(this.warningVehicles));
      this.sessionStorageService.setItem("errorVehicles", JSON.stringify(this.errorVehicles));
      this.firstLoad = false;
    }

    this._loadGraphData$.next(this._series);
  }

  /**
   * Gestisce la logica del click sulla fetta "funzionante" del grafico degli errori
   */
  workingClick() {
    const tableData = JSON.parse(this.sessionStorageService.getItem("allVehicles"));

    if (this.errorSliceSelected === "working") {
      this.errorSliceSelected = "";
      this.sessionStorageService.setItem("errorSlice", "");//fetta selezionata in session storage
      this.checkErrorsService.fillTable$.next(this.checkBlackBoxSlice());
    } else {
      //sessionStorage.setItem("errorSlice", "working"); // Salvataggio scelta attuale in sessionStorage
      this.errorSliceSelected = "working";
      this.sessionStorageService.setItem("errorSlice", "working");//fetta selezionata in session storage
      this.loadFunzionanteData$.next(this.workingVehicles);
    }
  }
  /**
   * Gestisce la logica del click sulla fetta "warning" del grafico degli errori
   */
  warningClick() {
    if (this.errorSliceSelected === "warning") {
      this.errorSliceSelected = "";
      this.sessionStorageService.setItem("errorSlice", ""); // Deseleziona la fetta
      this.checkErrorsService.fillTable$.next(this.checkBlackBoxSlice());
    } else {
      this.errorSliceSelected = "warning";
      this.sessionStorageService.setItem("errorSlice", "warning"); // Salva la scelta attuale
      this.loadWarningData$.next(this.warningVehicles);
    }
  }

  /**
   * Gestisce la logica del click sulla fetta "error" del grafico degli errori
   */
  errorClick() {
    const tableData = JSON.parse(this.sessionStorageService.getItem("allVehicles") || "[]");

    if (this.errorSliceSelected === "error") {
      this.errorSliceSelected = "";
      this.sessionStorageService.setItem("errorSlice", ""); // Deseleziona la fetta
      this.checkErrorsService.fillTable$.next(this.checkBlackBoxSlice());
    } else {
      this.errorSliceSelected = "error";
      this.sessionStorageService.setItem("errorSlice", "error"); // Salva la scelta attuale
      this.loadErrorData$.next(this.errorVehicles);
    }
  }

  checkBlackBoxSlice(): any[] {
    let vehicles: any[] = [];

    switch (this.sessionStorageService.getItem("blackboxSlice")) {
      case "blackbox":
        vehicles = JSON.parse(this.sessionStorageService.getItem("blackboxVehicles") || "[]");
        console.log(vehicles);
        break;

      case "blackbox+antenna":
        vehicles = JSON.parse(this.sessionStorageService.getItem("blackboxAntennaVehicles") || "[]");
        break;

      default:
        vehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles") || "[]");
        break;
    }

    return vehicles;
  }


  /*getters & setters*/

  public get errorSliceSelected(): string {
    return this._errorSliceSelected;
  }
  public set errorSliceSelected(value: string) {
    this._errorSliceSelected = value;
  }
  public get workingVehicles(): any[] {
    return this._workingVehicles;
  }
  public set workingVehicles(value: any[]) {
    this._workingVehicles = value;
  }

  public get warningVehicles(): any[] {
    return this._warningVehicles;
  }
  public set warningVehicles(value: any[]) {
    this._warningVehicles = value;
  }

  public get errorVehicles(): any[] {
    return this._errorVehicles;
  }
  public set errorVehicles(value: any[]) {
    this._errorVehicles = value;
  }

  public get loadGraphData$(): BehaviorSubject<any> {
    return this._loadGraphData$;
  }

  public get loadFunzionanteData$(): BehaviorSubject<any[]> {
    return this._loadFunzionanteData$;
  }

  public get loadWarningData$(): BehaviorSubject<any[]> {
    return this._loadWarningData$;
  }

  public get loadErrorData$(): BehaviorSubject<any[]> {
    return this._loadErrorData$;
  }

  public get colors() {
    return this._colors;
  }

  public get series() {
    return this._series;
  }
}
