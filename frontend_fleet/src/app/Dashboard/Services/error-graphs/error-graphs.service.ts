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
  //carica grafico degli errori con una series
  private readonly _loadGraphData$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
  //trasporta i dati dei veicoli funzionanti
  private readonly _loadFunzionanteData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  //trasporta i dati dei veicoli in warning
  private readonly _loadWarningData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  //trasporta i dati dei veicoli in errore
  private readonly _loadErrorData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);


  private _graphTitle = "GPS";
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

    this._series = [0, 0, 0]; // [working, warning, error]

    //controlli su gps e antenna
    const gpsCheckResult: Vehicle[][] = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);
    const antennaCheckResult: Vehicle[][] = this.checkErrorsService.checkVehiclesAntennaErrors(vehicles);
    const sessionCheckResult: Vehicle[][] = this.checkErrorsService.checkVehiclesSessionErrors(vehicles);

    const workingVehiclesSet = new Set<Vehicle>();
    const warningVehiclesSet = new Set<Vehicle>();
    const errorVehiclesSet = new Set<Vehicle>();

    //aggiunta risultati gps
    gpsCheckResult[0].forEach(vehicle => workingVehiclesSet.add(vehicle));
    gpsCheckResult[1].forEach(vehicle => warningVehiclesSet.add(vehicle));
    gpsCheckResult[2].forEach(vehicle => errorVehiclesSet.add(vehicle));

    //aggiunta risultati antenna
    antennaCheckResult[0].forEach(vehicle => workingVehiclesSet.add(vehicle));
    antennaCheckResult[1].forEach(vehicle => warningVehiclesSet.add(vehicle));
    antennaCheckResult[2].forEach(vehicle => errorVehiclesSet.add(vehicle));

    //aggiunta risultati sessione
    sessionCheckResult[0].forEach(vehicle => workingVehiclesSet.add(vehicle));
    sessionCheckResult[1].forEach(vehicle => errorVehiclesSet.add(vehicle));

    //filtri per priorità

    warningVehiclesSet.forEach(vehicle => {
        if (errorVehiclesSet.has(vehicle)) {
            warningVehiclesSet.delete(vehicle);
        }
    });

    workingVehiclesSet.forEach(vehicle => {
        if (warningVehiclesSet.has(vehicle) || errorVehiclesSet.has(vehicle)) {
            workingVehiclesSet.delete(vehicle);
        }
    });

    this.errorsData.workingVehicles = Array.from(workingVehiclesSet);
    this.errorsData.warningVehicles = Array.from(warningVehiclesSet);
    this.errorsData.errorVehicles = Array.from(errorVehiclesSet);

    //impostazione series
    this._series = [
        this.errorsData.workingVehicles.length,
        this.errorsData.warningVehicles.length,
        this.errorsData.errorVehicles.length
    ];

    //calcolo in sessionstorage alla prima esecuzione
    if (this.firstLoad) {
        this.sessionStorageService.setItem("workingVehicles", JSON.stringify(this.errorsData.workingVehicles));
        this.sessionStorageService.setItem("warningVehicles", JSON.stringify(this.errorsData.warningVehicles));
        this.sessionStorageService.setItem("errorVehicles", JSON.stringify(this.errorsData.errorVehicles));
        this.firstLoad = false;
    }

    this._loadGraphData$.next(this._series); //invio dati per il caricamento dei grafici
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
  public get graphTitle() {
    return this._graphTitle;
  }
  public set graphTitle(value) {
    this._graphTitle = value;
  }
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
  public set series(value: any[]) {
    this._series = value;
  }
}
