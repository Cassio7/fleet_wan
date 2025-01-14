import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { VehicleData } from '../../Models/VehicleData';

export interface blackboxData {
  sliceSelected: string;
  blackboxOnly: VehicleData[];
  blackboxWithAntenna: VehicleData[];
}
@Injectable({
  providedIn: 'root'
})
export class AntennaFilterService {
private readonly _filterTableByAntenna$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private readonly _updateAntennaOptions$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  private _allSelected: boolean = false;
  private _allOptions: string[] = ["Funzionante", "Errore", "Blackbox"];
  private _selectedOptions: string[] = [];
  private blackboxData: blackboxData = {
    sliceSelected: "",
    blackboxOnly: [] as any[],
    blackboxWithAntenna: [] as any[]
  }
  constructor(
    private checkErrorsService: CheckErrorsService
  ) { }

  /**
   * Seleziona / deseleziona tutti gli stati delle antenne dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllAntenne(): string{
    if (this.allSelected) {
      this.filterTableByAntenna$.next([]);
      this.selectedOptions = [];
      this.allSelected = false;
      return "";
    } else {
      this.filterTableByAntenna$.next(["all"]);
      this.selectedOptions = this._allOptions;
      this.allSelected = true;
      return "all";
    }
  }

  updateSelectedOptions(vehicles: VehicleData[]){
    this.selectedOptions = [];
    const antennaErrorsCheck = this.checkErrorsService.checkVehiclesAntennaErrors(vehicles);
    const antennaPresenceCheck = this.getAllRFIDVehicles(vehicles);

    if(antennaErrorsCheck[0].length>0){
      this.selectedOptions.push("Funzionante");
    }
    if(antennaErrorsCheck[1].length>0){
      this.selectedOptions.push("Errore");
    }
    if(antennaPresenceCheck.blackboxOnly.length>0){
      this.selectedOptions.push("Blackbox");
    }

    if(JSON.stringify(this.selectedOptions) == JSON.stringify(this.allOptions)){
      this.selectedOptions.push("Seleziona tutto");
      this.allSelected = true;
    }

    this.updateAntennaOptions$.next(this.selectedOptions);

    return this.selectedOptions;
  }

  /**
   * Prende tutti i veicoli su cui è stata montata un antenna per leggere i tag
   * @param vehicles oggetto custom di veicoli
   * @returns un oggetto di tipo blackboxData che contiene i veicoli con solo blackbox e con blackbox + antenna
   */
  public getAllRFIDVehicles(vehiclesData: VehicleData[]): blackboxData {
    this.blackboxData = {
      sliceSelected: "",
      blackboxOnly: [] as VehicleData[],
      blackboxWithAntenna: [] as VehicleData[],
    };

    for(const v of vehiclesData){
      v.vehicle.isRFIDReader == true ? this.blackboxData.blackboxWithAntenna.push(v) : this.blackboxData.blackboxOnly.push(v);
    }

    return this.blackboxData;
  }

  /**
   * controlla se sono selezionati tutti gli stati gps
   * @returns true se è tutto selezionato
   * @returns false se non è tutto selezionato
   */
  isAntennaFilterAllSelected(): boolean{
    return this.allSelected;
  }

  public get updateAntennaOptions$(): BehaviorSubject<string[]> {
    return this._updateAntennaOptions$;
  }
  public get allOptions(): string[] {
    return this._allOptions;
  }
  public set allOptions(value: string[]) {
    this._allOptions = value;
  }
  public get selectedOptions(): string[] {
    return this._selectedOptions;
  }
  public set selectedOptions(value: string[]) {
    this._selectedOptions = value;
  }
  public get allSelected(): boolean {
    return this._allSelected;
  }
  public set allSelected(value: boolean) {
    this._allSelected = value;
  }
  public get filterTableByAntenna$(): BehaviorSubject<string[]> {
    return this._filterTableByAntenna$;
  }
}
