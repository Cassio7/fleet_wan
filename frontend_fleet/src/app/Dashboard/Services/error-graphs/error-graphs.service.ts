import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { Vehicle } from '../../../Models/Vehicle';

interface ErrorsData {
  workingVehicles: any[];
  warningVehicles: any[];
  errorVehicles: any[];
  errorSliceSelected: string;
}
@Injectable({
  providedIn: 'root'
})
export class ErrorGraphsService{
  /**
   * carica grafico degli errori con una series
   */
  private _loadGraphData$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
  /**
   * trasporta i dati dei veicoli funzionanti
   */
  private _loadFunzionanteData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  /**
   * trasporta i dati dei veicoli in warning
   */
  private _loadWarningData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  /**
   * trasporta i dati dei veicoli in errore
   */
  private _loadErrorData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private _series = [0,0,0];//[funzionante, warning, error]
  private _colors = ["#5C9074", "#ffcc00", "#d12717"];
  private _height = 400;
  private _width = 300;


  private _errorsData: ErrorsData = {
    workingVehicles: [],
    warningVehicles: [],
    errorVehicles: [],
    errorSliceSelected: ""
  };

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
    this.errorsData.workingVehicles = [];
    this.errorsData.warningVehicles = [];
    this.errorsData.errorVehicles = [];

    this._series = [0,0,0];
    for (const vehicle of vehicles) {
      //controllo errori sul veicolo corrente
      const hasGpsError = this.checkErrorsService.checkGpsError(vehicle);
      const hasSessionError = this.checkErrorsService.checkSessionError(vehicle);
      const hasAntennaError = this.checkErrorsService.checkAntennaError(vehicle);

      // Nessun errore (funzionante)
      if (!hasGpsError && !hasSessionError && !hasAntennaError) {
        this.errorsData.workingVehicles.push(vehicle);
        this._series[0] += 1;
      // Errore GPS (warning)
      } else if (hasGpsError && !hasSessionError && !hasAntennaError) {
        this.errorsData.warningVehicles.push(vehicle);
        this._series[1] += 1;
      // Errori (sessione, antenna o entrambi)
      } else {
        this.errorsData.errorVehicles.push(vehicle);
        this._series[2] += 1;
      }
    }

    //impostazione veicoli dell'error graph in sessionstorage solo la prima volta che viene caricato
    if(this.firstLoad){
      this.sessionStorageService.setItem("workingVehicles", JSON.stringify(this.errorsData.workingVehicles));
      this.sessionStorageService.setItem("warningVehicles", JSON.stringify(this.errorsData.warningVehicles));
      this.sessionStorageService.setItem("errorVehicles", JSON.stringify(this.errorsData.errorVehicles));
      this.firstLoad = false;
    }

    this._loadGraphData$.next(this._series); //invio dati x caricare grafici
  }

  /**
   * Gestisce la logica del click sulla fetta "funzionante" del grafico degli errori
   */
  workingClick() {
    if (this.errorsData.errorSliceSelected === "working") {
      this.errorsData.errorSliceSelected = "";
      this.sessionStorageService.removeItem("errorSlice");//fetta selezionata in session storage
      this.checkErrorsService.fillTable$.next(this.checkBlackBoxSlice());
    } else {
      //sessionStorage.setItem("errorSlice", "working"); // Salvataggio scelta attuale in sessionStorage
      this.errorsData.errorSliceSelected = "working";
      this.sessionStorageService.setItem("errorSlice", "working");//fetta selezionata in session storage
      this.loadFunzionanteData$.next(this.errorsData.workingVehicles);
    }
  }
  /**
   * Gestisce la logica del click sulla fetta "warning" del grafico degli errori
   */
  warningClick() {
    if (this.errorsData.errorSliceSelected === "warning") {
      this.errorsData.errorSliceSelected = "";
      this.sessionStorageService.setItem("errorSlice", ""); // Deseleziona la fetta
      this.checkErrorsService.fillTable$.next(this.checkBlackBoxSlice());
    } else {
      this.errorsData.errorSliceSelected = "warning";
      this.sessionStorageService.setItem("errorSlice", "warning"); // Salva la scelta attuale
      this.loadWarningData$.next(this.errorsData.warningVehicles);
    }
  }

  /**
   * Gestisce la logica del click sulla fetta "error" del grafico degli errori
   */
  errorClick() {
    if (this.errorsData.errorSliceSelected === "error") {
      this.errorsData.errorSliceSelected = "";
      this.sessionStorageService.removeItem("errorSlice"); // Deseleziona la fetta
      this.checkErrorsService.fillTable$.next(this.checkBlackBoxSlice());
    } else {
      this.errorsData.errorSliceSelected = "error";
      this.sessionStorageService.setItem("errorSlice", "error"); // Salva la scelta attuale
      this.loadErrorData$.next(this.errorsData.errorVehicles);
    }
  }

  /**
   * Controlla se al momento della chiamata uno spicchio del grafico dei blackbox è stato selezionato
   * @returns veicoli sui quali è stato applicato il filtro corrispondente allo spicchio se esiste
  */
  checkBlackBoxSlice(): Vehicle[] {
    let vehicles: Vehicle[] = [];

    switch (this.sessionStorageService.getItem("blackboxSlice")) {
      case "blackbox":
        vehicles = JSON.parse(this.sessionStorageService.getItem("blackboxVehicles") || "[]");
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

  /**
   * Azzera i valori dei grafici degli errori
   */
  resetGraphs(){
    this.loadGraphData$.next([]);
  }


  /*getters & setters*/
  public get width() {
    return this._width;
  }
  public set width(value) {
    this._width = value;
  }
  public get height() {
    return this._height;
  }
  public set height(value) {
    this._height = value;
  }
  public get errorsData(): ErrorsData {
    return this._errorsData;
  }

  public set errorsData(value: ErrorsData) {
    this._errorsData = value;
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
