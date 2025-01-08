import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CheckErrorsService } from '../check-errors/check-errors.service';
import { VehicleData } from '../../Models/VehicleData';

@Injectable({
  providedIn: 'root'
})
export class AntennaFilterService {
private readonly _filterTableByAntenna$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private _allSelected: boolean = false;
  private _allOptions: string[] = ["Funzionante", "Errore", "Blackbox"];
  private _selectedOptions: string[] = [];

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
    const antennaPresenceCheck = this.checkRFIDVehicles(vehicles);

    if(antennaErrorsCheck[0].length>0){
      this.selectedOptions.push("Funzionante");
    }
    if(antennaErrorsCheck[1].length>0){
      this.selectedOptions.push("Errore");
    }
    if(antennaPresenceCheck.length>0){
      this.selectedOptions.push("Blackbox");
    }

    if(JSON.stringify(this.selectedOptions) == JSON.stringify(["Funzionante", "Errore", "Blackbox"])){
      this.selectedOptions.push("Seleziona tutto");
    }

    return this.selectedOptions;
  }

  /**
   * Controlla i veicoli con antenna RFID
   * @param vehicles veicoli da controllare
   * @returns solo i veicoli con antenna RFID montata
   */
  checkRFIDVehicles(vehiclesData: VehicleData[]){
    return vehiclesData.filter(obj => obj.vehicle.isRFIDReader === true);
  }

  /**
   * controlla se sono selezionati tutti gli stati gps
   * @returns true se è tutto selezionato
   * @returns false se non è tutto selezionato
   */
  isAntennaFilterAllSelected(): boolean{
    return this.allSelected;
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
