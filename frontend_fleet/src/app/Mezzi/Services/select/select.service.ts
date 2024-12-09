import { Injectable } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';

@Injectable({
  providedIn: 'root'
})
export class SelectService {
  private _allPlatesSelected = true;
  private _allModelsSelected = true;

  private _plates: string[] = [];
  private _models: string[] = [];

  private _selectedVehicles: Vehicle[] = [];

  constructor() { }


  updateVehiclesSelectionByModel(vehicle: Vehicle) {
    const index = this.selectedVehicles.findIndex(v => v.model === vehicle.model);

    if (index === -1) {
      this.selectedVehicles.push(vehicle);
    } else {
      this.selectedVehicles.splice(index, 1);
    }
  }

  updateVehiclesSelectionByPlate(vehicle: Vehicle) {
    const index = this.selectedVehicles.findIndex(v => v.plate === vehicle.plate);

    if (index !== -1) {
      this.selectedVehicles.splice(index, 1);
    } else {
      this.selectedVehicles.push(vehicle);
    }
  }


  /**
   * Seleziona o deseleziona tutte le opzioni nel menu di una colonna
   * @param column colonna a cui appartiene il menu
   * @param vehicles veicoli da cui prendere i dati
   * @param $event evento per modificare comportamento del menù
   */
  selectDeselectAllColumnOptions(column: string, vehicles: Vehicle[], $event: any) {
    this.preventSelectClosing($event);

    switch (column) {
      case "targa":
        if (this.allPlatesSelected) {
          this.plates = [];// svuotamento array di targhe
          this.allPlatesSelected = false;
          return [];
        } else {
          this.plates = vehicles.map(vehicle => vehicle.plate); // seleziona tutte le targhe
          this.allPlatesSelected = true;
          return vehicles;
        }
      case "model":
        if (this.allModelsSelected) {
          this.models = [];// svuotamento array di modelli
          this.allModelsSelected = false;
          return [];
        } else {
          this.models = vehicles.map(vehicle => vehicle.model); // seleziona tutti i modelli
          this.allModelsSelected = true;
          return vehicles;
        }
    }

    return [];
  }

  /**
   * Riempe l'oggetto di dati selezionati con i dati corrispondenti, non ripetuti
   * @param vehicles veicoli dai quali riprendere i dati
   */
  selectAll(vehicles: Vehicle[]) {
    vehicles.forEach(vehicle => {
      if (!this.plates.includes(vehicle.plate)) {
        this.plates.push(vehicle.plate);
      }

      if (!this.models.includes(vehicle.model)) {
        this.models.push(vehicle.model);
      }
    });
  }

  /**
   * Fa in modo che il menù non si chiuda dopo aver selezionato un checkbox
   * @param $event evento
   */
  preventSelectClosing($event: MouseEvent): void {
    $event.stopPropagation();
    $event.preventDefault();
  }


  /**
   * Controlla se una targa è stata selezionata
   * @param plate targa da controllare
   * @returns true se la targa è contenuta, false se la targa non è contenuta nell'array
   */
  isPlateSelected(plate: string){
    const selectedPlates = this.selectedVehicles.map(vehicle => vehicle.plate);
    return selectedPlates.includes(plate);
  }

  /**
   * Controlla se un modello è stato selezionato
   * @param model modello da controllare
   * @returns true se il modello è contenuto, false se il modello non è contenuto nell'array
   */
  isModelSelected(model: string){
    const selectedModels = this.selectedVehicles.map(vehicle => vehicle.model);
    return selectedModels.includes(model);
  }

  public get plates(): string[] {
    return this._plates;
  }
  public set plates(value: string[]) {
    this._plates = value;
  }

  public get models(): string[] {
    return this._models;
  }
  public set models(value: string[]) {
    this._models = value;
  }

  public get selectedVehicles(): Vehicle[] {
    return this._selectedVehicles;
  }
  public set selectedVehicles(value: Vehicle[]) {
    this._selectedVehicles = value;
  }

  public get allPlatesSelected() {
    return this._allPlatesSelected;
  }
  public set allPlatesSelected(value: boolean) {
    this._allPlatesSelected = value;
  }

  public get allModelsSelected() {
    return this._allModelsSelected;
  }
  public set allModelsSelected(value: boolean) {
    this._allModelsSelected = value;
  }
}
