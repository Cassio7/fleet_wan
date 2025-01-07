import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
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
  /**
   * Trasporta i dati dei veicoli nel caso uno spicchio venga deselezionato
   */
  private _loadGraphData$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
  /**
   * Trasporta i veicoli con blackbox, sui quali verrà chiamata "onGraphClick(blackboxVehicles)" nel table component
   */
  private _loadBlackBoxData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  /**
   * Trasporta i veicoli con e antenna, sui quali verrà chiamata "onGraphClick(blackboxAntennaVehicles)" nel table component
   */
  private _loadBlackBoxAntennaData$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  private firstLoad:boolean = true;

  private _series: number[] = []; //[blackbox, blackbox + antenna]
  private _colors = ["#ff00f2", "#479dff"];
  private _height = 400;
  private _width = 350;


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
   * @returns un oggetto di tipo blackboxData che contiene i veicoli con solo blackbox e con blackbox + antenna
   */
  public getAllRFIDVehicles(vehicles: any[]) {
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
      this.sessionStorageService.removeItem("blackboxSlice");
      this.checkErrorsService.fillTable$.next(this.checkErrorGraphSlice());
    } else {
      // sessionStorage.setItem("blackboxSlice", "blackbox"); // Salvataggio scelta attuale in sessionStorage
      this.blackBoxSliceSelected = "blackbox";
      this.sessionStorageService.setItem("blackboxSlice", "blackbox");
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
      this.sessionStorageService.removeItem("blackboxSlice");
      this.checkErrorsService.fillTable$.next(this.checkErrorGraphSlice());
    } else {
      this.blackBoxSliceSelected = "blackbox+antenna";
      this.sessionStorageService.setItem("blackboxSlice", "blackbox+antenna");
      this.loadBlackBoxData$.next(this.getAllRFIDVehicles(tableVehicles).blackboxWithAntenna);
    }
  }

  /**
   * Controlla se al momento della chiamata uno spicchio del grafico degli errori è stato selezionato
   * @returns veicoli sui quali è stato applicato il filtro corrispondente allo spicchio se esiste
   */
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

  /**
   * Resetta il valore dei grafici dei blackbox
   */
  resetGraphs(){
    this.loadGraphData$.next([]);
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
