import { Injectable } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';

interface SelectionStates {
  allPlatesSelected: boolean;
  allModelsSelected: boolean;
  allCantieriSelected: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SelectService {
  private _selectionStates: SelectionStates = {
    allPlatesSelected: true,
    allModelsSelected: true,
    allCantieriSelected: true,
  };



  private _selectedVehicles: Vehicle[] = [];

  constructor() { }

  /**
   * Aggiorna i veicoli selezionati in base al modello di un veicolo
   * @param allVehicles veicoli
   * @param vehicle veicolo da cui prendere il modello e da aggiungere, in caso, ai veicoli selezionati
   */
  updateVehiclesSelectionByModel(allVehicles: Vehicle[], vehicle: Vehicle) {
    const exists = this.selectedVehicles.some(v => v.model === vehicle.model); //controllo della presenza del veicolo nell'array dei veicoli selezionati

    if (!exists) {
      const addingVehicles = allVehicles.filter(v => v.model === vehicle.model);
      this.selectedVehicles = [...this.selectedVehicles, ...addingVehicles]; //aggiunta di tutti i veicoli con il modello del veicolo
    } else {
      this.selectedVehicles = this.selectedVehicles.filter(v => v.model !== vehicle.model); //rimozione di tutti i veicoli con il modello del veicolo
    }
  }


  /**
   * Aggiorna i veicoli selezionati in base al cantiere di un veicolo
   * @param allVehicles veicoli
   * @param vehicle veicolo da cui prendere il cantiere e da aggiungere, in caso, ai veicoli selezionati
   */
  updateVehiclesSelectionByCantiere(allVehicles: Vehicle[], vehicle: Vehicle) {
    const exists = this.selectedVehicles.some(v => v.worksite?.name === vehicle.worksite?.name);

    if (!exists) {
      const addingVehicles = allVehicles.filter(v => v.worksite?.name === vehicle.worksite?.name);
      this.selectedVehicles = [...this.selectedVehicles, ...addingVehicles];
    } else {
      this.selectedVehicles = this.selectedVehicles.filter(v => v.worksite?.name !== vehicle.worksite?.name);
    }
  }


  /**
   * Aggiorna i veicoli selezionati in base alla targa di un veicolo
   * @param allVehicles veicoli
   * @param vehicle veicolo da cui prendere la targa e da aggiungere, in caso, ai veicoli selezionati
   */
  updateVehiclesSelectionByPlate(allVehicles: Vehicle[], vehicle: Vehicle) {
    const exists = this.selectedVehicles.some(v => v.plate === vehicle.plate);

    if (!exists) {
      const addingVehicles = allVehicles.filter(v => v.plate === vehicle.plate);
      this.selectedVehicles = [...this.selectedVehicles, ...addingVehicles];
    } else {
      this.selectedVehicles = this.selectedVehicles.filter(v => v.plate !== vehicle.plate);
    }
  }



  /**
   * Seleziona e deseleziona tutti i veicoli
   * @param allVehicles tutti i veicoli
   * @param $event evento
   * @returns array di tutti i veicoli se non era tutto selezionato
   * altrimenti un array vuoto
   */
  selectDeselectAll(allVehicles: Vehicle[], $event: any) {
    $event.stopPropagation();

    //attributo preso a caso, poteva essere qualunque
    if (this.selectionStates.allPlatesSelected) {
      this.selectionStates.allPlatesSelected = false;
      this.selectedVehicles = [];
      return [];
    } else {
      this.selectionStates.allPlatesSelected = true;
      this.selectedVehicles = allVehicles;
      return allVehicles;
    }

  }

  /**
   * Seleziona tutti i veicoli
   * @param vehicles veicoli da selezionare
   */
  selectVehicles(vehicles: Vehicle[]) {
    this.selectedVehicles = vehicles;
  }

  /**
   * Controlla se una targa è stata selezionata
   * @param plate targa da controllare
   * @returns true se la targa è contenuta, false se la targa non appartiene
   * a nessun veicolo nell'array di veicoli selezionati
   */
  isPlateSelected(plate: string){
    const selectedPlates = this.selectedVehicles.map(vehicle => vehicle.plate);
    return selectedPlates.includes(plate);
  }

  /**
   * Controlla se un modello è stato selezionato
   * @param model modello da controllare
   * @returns true se il modello è contenuto, false se il modello non appartiene
   * a nessun veicolo nell'array di veicoli selezionati
   */
  isModelSelected(model: string){
    const selectedModels = this.selectedVehicles.map(vehicle => vehicle.model);
    return selectedModels.includes(model);
  }

  /**
   * Controlla se un cantiere è stato selezionato
   * @param model cantiere da controllare
   * @returns true se il cantiere è contenuto, false se il cantiere non appartiene
   * a nessun veicolo nell'array di veicoli selezionati
   */
  isCantiereSelected(worksite: string | undefined){
    if(worksite){
      const selectedCantieri = this.selectedVehicles.map(vehicle => vehicle.worksite?.name);
      return selectedCantieri.includes(worksite);
    }
    return false;
  }

  public get selectedVehicles(): Vehicle[] {
    return this._selectedVehicles;
  }
  public set selectedVehicles(value: Vehicle[]) {
    this._selectedVehicles = value;
  }
  public get selectionStates(): SelectionStates {
    return this._selectionStates;
  }
  public set selectionStates(value: SelectionStates) {
    this._selectionStates = value;
  }
}
