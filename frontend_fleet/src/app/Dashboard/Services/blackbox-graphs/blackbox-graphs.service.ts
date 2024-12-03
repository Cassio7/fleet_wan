import { ChangeDetectorRef, Injectable, OnInit } from '@angular/core';
import { VehiclesApiService } from '../../../Common-services/vehicles/vehicles-api.service';
import { BehaviorSubject, lastValueFrom, Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';

export interface blackboxData {
  sliceSelected: string;
  blackboxOnly: any[];
  blackboxWithAntenna: any[];
}

@Injectable({
  providedIn: 'root'
})
export class BlackboxGraphsService{
  private _loadGraphData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadBlackBoxData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _loadBlackBoxAntennaData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private firstLoad:boolean = true;

  private _series: number[] = []; //[blackbox, blackbox + antenna]
  private _colors = ["#0061ff", "#009bff"];

  private blackboxData: blackboxData = {
    sliceSelected: "",
    blackboxOnly: [] as any[],
    blackboxWithAntenna: [] as any[]
  }
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
    this.blackboxData = {
      sliceSelected: "",
      blackboxOnly: [] as Vehicle[],
      blackboxWithAntenna: [] as Vehicle[],
    };

    for(const v of vehicles){
      v.isRFIDReader == true ? this.blackboxData.blackboxWithAntenna.push(v) : this.blackboxData.blackboxOnly.push(v);
    }

    return this.blackboxData;
  }

  /**
   * Permette di preparare l'array per riempire il grafico dei blackbox
   * e notifica e manda i dati al grafico tramite un subject
   * @param vehicles oggetto custom di veicoli
   */
  public loadChartData(vehicles: any[]){
    try {
      this.blackboxData = this.getAllRFIDVehicles(vehicles);
      this._series = [
        this.blackboxData.blackboxOnly.length,
        this.blackboxData.blackboxWithAntenna.length,
      ];
    } catch (error) {
      console.error("Error loading chart data: ", error);
    }
    //salvataggio dati grafico nel sessionstorage
    if(this.firstLoad){
      this.sessionStorageService.setItem("blackboxVehicles", JSON.stringify(this.blackboxData.blackboxOnly));
      this.sessionStorageService.setItem("blackboxAntennaVehicles", JSON.stringify(this.blackboxData.blackboxWithAntenna));
      this.firstLoad = false;
    }
    this._loadGraphData$.next(this._series);
  }
  /**
   * Gestisce la logica del click sulla fetta "blackbox" del grafico dei blackbox
   */
  blackBoxClick() {
    let tableVehicles: any[] = [];
    tableVehicles = JSON.parse(this.sessionStorageService.getItem("tableData"));

    if (this.blackBoxSliceSelected === "blackbox") {
      this.blackBoxSliceSelected = "";
      this.sessionStorageService.setItem("blackboxSlice", "");
      this.checkErrorsService.fillTable$.next(this.checkErrorGraphSlice());
    } else {
      // sessionStorage.setItem("blackboxSlice", "blackbox"); // Salvataggio scelta attuale in sessionStorage
      this.blackBoxSliceSelected = "blackbox";
      this.sessionStorageService.setItem("blackboxSlice", "blackbox");
      this.loadBlackBoxData$.next(this.getAllRFIDVehicles(this.checkErrorGraphSlice()).blackboxOnly);
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
      this.sessionStorageService.setItem("blackboxSlice", "");
      this.checkErrorsService.fillTable$.next(this.checkErrorGraphSlice());
    } else {
      this.blackBoxSliceSelected = "blackbox+antenna";
      this.sessionStorageService.setItem("blackboxSlice", "blackbox+antenna");
      this.loadBlackBoxData$.next(this.getAllRFIDVehicles(this.checkErrorGraphSlice()).blackboxWithAntenna);
    }
  }

  checkErrorGraphSlice(): any[] {
    let vehicles: any[] = [];

    switch (this.sessionStorageService.getItem("errorSlice")) {
      case "working":
        vehicles = JSON.parse(this.sessionStorageService.getItem("workingVehicles") || "[]");
        break;

      case "warning":
        vehicles = JSON.parse(this.sessionStorageService.getItem("warningVehicles") || "[]");
        break;

      case "error":
        vehicles = JSON.parse(this.sessionStorageService.getItem("errorVehicles") || "[]");
        break;

      default:
        vehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles") || "[]");
        break;
    }

    return vehicles;
  }

  resetGraphs(){
    this.loadGraphData$.next([]);
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
