import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../check-errors/check-errors.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorGraphsService{
  public fillTable$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadGraphData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadFunzionanteData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadWarningData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadErrorData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private _series = [0,0,0];//[funzionante, warning, error]
  private _colors = ["#46ff00", "#ffd607", "#ff0000"];

  private _workingVehicles: any[] = [];
  private _warningVehicles: any[] = [];
  private _errorVehicles: any[] = [];

  private errorSliceSelected: string = "";


  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }

  /**
  * Permette di preparare l'array per riempire il grafico degli errori
  * e notifica e manda i dati al grafico tramite un subject
  * @param vehicles oggetto custom di veicoli
  */
  public loadChartData(vehicles: any[]) {
    for (const vehicle of vehicles) {
      const hasGpsError = this.checkErrorsService.checkGpsError(vehicle);
      const hasSessionError = this.checkErrorsService.checkSessionError(vehicle);
      const hasAntennaError = this.checkErrorsService.checkAntennaError(vehicle);

      // Controllo errore GPS (warning) - solo se non ci sono altri errori
      if (hasGpsError && !hasSessionError && !hasAntennaError) {
        this._series[1] += 1; //Aggiungi warning
        this.warningVehicles.push(vehicle);
      }
      // Controllo errore antenna (Errore) - solo se non ci sono altri errori
      else if (hasAntennaError && !hasSessionError && !hasGpsError) {
        this.errorVehicles.push(vehicle);
        this._series[2] += 1; //Aggiunta errore
      }
      // Controllo errore sessione (Errore) - solo se non ci sono altri errori
      else if (hasSessionError && !hasGpsError && !hasAntennaError) {
        this.errorVehicles.push(vehicle);
        this._series[2] += 1; //Aggiunta errore
      }
      else if (hasAntennaError && hasSessionError){ //Controllo errori di sessione e antenna (Errore)
        this.errorVehicles.push(vehicle);
        this.series[2] += 1; //Aggiunta errore
      }
      // Controllo nessun errore (funzionante)
      else if (!hasGpsError && !hasSessionError && !hasAntennaError) {
        this.workingVehicles.push(vehicle);
        this._series[0] += 1; //Aggiunta funzionante
      }
    }

    this._loadGraphData$.next(this._series);
  }

  workingClick() {
    if (this.errorSliceSelected === "working") {
      let allVehicles: any[] = [];

      if (typeof sessionStorage !== "undefined") {
        const storedVehicles = sessionStorage.getItem("allVehicles");
        allVehicles = storedVehicles ? JSON.parse(storedVehicles) : [];
      }

      this.errorSliceSelected = "";
      this.fillTable$.next(allVehicles);
    } else {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("errorSlice", "working"); // Salvataggio scelta attuale in sessionStorage
      }

      this.errorSliceSelected = "working";
      this.loadFunzionanteData$.next(this.workingVehicles);
    }
  }

  warningClick() {
    if (this.errorSliceSelected === "warning") {
      let allVehicles: any[] = [];

      if (typeof sessionStorage !== "undefined") {
        const storedVehicles = sessionStorage.getItem("allVehicles");
        allVehicles = storedVehicles ? JSON.parse(storedVehicles) : [];
      }

      this.errorSliceSelected = "";
      this.fillTable$.next(allVehicles);
    } else {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("errorSlice", "warning"); // Salvataggio scelta attuale in sessionStorage
      }

      this.errorSliceSelected = "warning";
      this.loadWarningData$.next(this.warningVehicles);
    }
  }

  errorClick() {
    if (this.errorSliceSelected === "error") {
      let allVehicles: any[] = [];

      if (typeof sessionStorage !== "undefined") {
        const storedVehicles = sessionStorage.getItem("allVehicles");
        allVehicles = storedVehicles ? JSON.parse(storedVehicles) : [];
      }

      this.errorSliceSelected = "";
      this.fillTable$.next(allVehicles);
    } else {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("errorSlice", "error"); // Salvataggio scelta attuale in sessionStorage
      }

      this.errorSliceSelected = "error";
      this.loadErrorData$.next(this.errorVehicles);
    }
  }




  /*getters & setters*/

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
