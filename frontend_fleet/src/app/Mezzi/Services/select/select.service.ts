import { Injectable } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';


export interface selectedData {
  plates: any[];
  modelli: any[];
  firstEvents: Date[];
}

@Injectable({
  providedIn: 'root'
})
export class SelectService {
  private allPlatesSelected = true;
  private allModelsSelected = true;
  private _selectedData: selectedData = {
    plates: [],
    modelli: [],
    firstEvents: []
  };

  constructor() { }

  /**
   * Aggiunge una targa all'array di targhe selezionate
   * @param plate targa da aggiungere
   */
  updatePlateSelection(plate: string){
    if(!this.selectedData.plates.includes(plate)){
      this.selectedData.plates.push(plate);
    }else{
      const index = this.selectedData.plates.indexOf(plate);
      this.selectedData.plates.splice(index, 1);
    }
  }

  updateModelSelection(model: string){
    if(!this.selectedData.modelli.includes(model)){
      this.selectedData.modelli.push(model);
    }else{
      const index = this.selectedData.modelli.indexOf(model);
      this.selectedData.modelli.splice(index, 1);
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

    switch(column) {
      case "targa":
        if (this.allPlatesSelected) {
          this.selectedData.plates = [];// svuotamento array di targhe
          this.allPlatesSelected = false;
          return [];
        } else {
          this.selectedData.plates = vehicles.map(vehicle => vehicle.plate);// seleziona tutte le targhe
          this.allPlatesSelected = true;
          return vehicles;
        }
      case "model":
        if (this.allModelsSelected) {
          this.selectedData.modelli = [];// svuotamento array di targhe
          this.allModelsSelected = false;
          return [];
        } else {
          this.selectedData.plates = vehicles.map(vehicle => vehicle.plate);// seleziona tutte le targhe
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
      this.selectedData.plates.push(vehicle.plate);

      if (!this.selectedData.modelli.includes(vehicle.model)) {
        this.selectedData.modelli.push(vehicle.model);
      }

      if (vehicle.firstEvent) {
        this.selectedData.firstEvents.push(new Date(vehicle.firstEvent));
      }
    });
  }


  preventSelectClosing($event: any){
    $event.stopPropagation();
    $event.preventDefault();
  }

  public get selectedData(): selectedData {
    return this._selectedData;
  }
  public set selectedData(value: selectedData) {
    this._selectedData = value;
  }
}
