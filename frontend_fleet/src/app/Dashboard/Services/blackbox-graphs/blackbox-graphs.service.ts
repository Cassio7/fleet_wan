import { ChangeDetectorRef, Injectable, OnInit } from '@angular/core';
import { VehiclesApiService } from '../vehicles/vehicles-api.service';
import { BehaviorSubject, lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../check-errors/check-errors.service';

@Injectable({
  providedIn: 'root'
})


export class BlackboxGraphsService{
  private _loadGraphData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private _series: number[] = []; //[blackbox, blackbox + antenna]
  private _colors = ["#0061ff", "#009bff"];

  private errorSliceSelected: string = "";

  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }



  /**
   * Prende tutti i veicoli su cui è stata montata un antenna per leggere i tag
   * @param vehicles oggetto custom di veicoli
   * @returns un oggetto che contiene i veicoli con solo blackbox e con blackbox + antenna
   */
  private getAllRFIDVehicles(vehicles: any[]) {
    const categorizedVehicles = {
      blackboxOnly: [] as Vehicle[],
      blackboxWithAntenna: [] as Vehicle[],
    };

    for(const v of vehicles){
      v.isRFIDReader == true ? categorizedVehicles.blackboxWithAntenna.push(v) : categorizedVehicles.blackboxOnly.push(v);
    }

    return categorizedVehicles;
  }

  /**
   * Permette di preparare l'array per riempire il grafico dei blackbox
   * e notifica e manda i dati al grafico tramite un subject
   * @param vehicles oggetto custom di veicoli
   */
  public loadChartData(vehicles: any[]){
    let series: number[] = [];
    try {
      const categorizedVehicles = this.getAllRFIDVehicles(vehicles);
      series = [
        categorizedVehicles.blackboxOnly.length,
        categorizedVehicles.blackboxWithAntenna.length,
      ];
    } catch (error) {
      console.error("Error loading chart data: ", error);
    }
    this._series = series;
    this._loadGraphData$.next(series);
  }

  workingClick() {
    if (this.errorSliceSelected === "working") {
      let allVehicles: any[] = [];

      if (typeof sessionStorage !== "undefined") {
        const storedVehicles = sessionStorage.getItem("allVehicles");
        allVehicles = storedVehicles ? JSON.parse(storedVehicles) : [];
      }

      this.errorSliceSelected = "";
      this.checkErrorsService.fillTable$.next(allVehicles);
    } else {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("errorSlice", "working"); // Salvataggio scelta attuale in sessionStorage
      }

      this.errorSliceSelected = "working";
      // this.loadFunzionanteData$.next(this.workingVehicles);
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
      this.checkErrorsService.fillTable$.next(allVehicles);
    } else {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("errorSlice", "warning"); // Salvataggio scelta attuale in sessionStorage
      }

      this.errorSliceSelected = "warning";
      // this.loadWarningData$.next(this.warningVehicles);
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
      this.checkErrorsService.fillTable$.next(allVehicles);
    } else {
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem("errorSlice", "error"); // Salvataggio scelta attuale in sessionStorage
      }

      this.errorSliceSelected = "error";
      // this.loadErrorData$.next(this.errorVehicles);
    }
  }

  public get loadGraphData$(): BehaviorSubject<any[]> {
    return this._loadGraphData$;
  }

  public get colors(): string[] {
    return this._colors;
  }

  public get series() {
    return this._series;
  }

}
