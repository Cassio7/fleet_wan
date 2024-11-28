import { ChangeDetectorRef, Injectable, OnInit } from '@angular/core';
import { VehiclesApiService } from '../vehicles/vehicles-api.service';
import { BehaviorSubject, lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { SessionStorageService } from '../../../Common services/sessionStorage/session-storage.service';

@Injectable({
  providedIn: 'root'
})


export class BlackboxGraphsService{
  private _loadGraphData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadBlackBoxData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadBlackBoxAntennaData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);


  private _series: number[] = []; //[blackbox, blackbox + antenna]
  private _colors = ["#0061ff", "#009bff"];

  private blackBoxSliceSelected: string = "";

  constructor(
    private checkErrorsService: CheckErrorsService,
    private sessionStorageService: SessionStorageService
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
  /**
   * Gestisce la logica del click sulla fetta "blackbox" del grafico dei blackbox
   */
  blackBoxClick() {
    let tableVehicles: any[] = [];
    tableVehicles = JSON.parse(this.sessionStorageService.getItem("tableData"));

    if (this.blackBoxSliceSelected === "blackbox") {
      this.blackBoxSliceSelected = "";
      this.checkErrorsService.fillTable$.next(tableVehicles); //Riempi la tabella senza filtri
    } else {
      // sessionStorage.setItem("blackboxSlice", "blackbox"); // Salvataggio scelta attuale in sessionStorage
      this.blackBoxSliceSelected = "blackbox";
      this.loadBlackBoxData$.next(this.getAllRFIDVehicles(tableVehicles).blackboxOnly);
    }
  }
  /**
   * Gestisce la logica del click sulla fetta "blaxbox+antenna" del grafico dei blackbox
   */
  blackBoxAntennaClick() {
    let tableVehicles: any[] = [];
    tableVehicles = JSON.parse(this.sessionStorageService.getItem("tableData"));

    if (this.blackBoxSliceSelected === "blackbox+antenna") {
      this.blackBoxSliceSelected = "";
      this.checkErrorsService.fillTable$.next(tableVehicles);
    } else {
      this.blackBoxSliceSelected = "blackbox+antenna";
      this.loadBlackBoxData$.next(this.getAllRFIDVehicles(tableVehicles).blackboxWithAntenna);
    }
  }

  public get loadBlackBoxData$(): BehaviorSubject<any[]> {
    return this._loadBlackBoxData$;
  }

  public get loadBlackBoxAntennaData$(): BehaviorSubject<any[]> {
    return this._loadBlackBoxAntennaData$;
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
