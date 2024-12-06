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
  private platesAllSelected = true;
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
  addPlateSelection(plate: string){
    if(!this.selectedData.plates.includes(plate)){
      this.selectedData.plates.push(plate);
    }else{
      const index = this.selectedData.plates.indexOf(plate);
      this.selectedData.plates.splice(index, 1);
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
        if (this.platesAllSelected) {
          this.selectedData.plates = [];// svuotamento array di targhe
          this.platesAllSelected = false;
          return [];
        } else {
          this.selectedData.plates = vehicles.map(vehicle => vehicle.plate);// seleziona tutte le targhe
          this.platesAllSelected = true;
          return vehicles;
        }
    }

    return [];
  }


  selectAll(vehicles: Vehicle[]){
    vehicles.forEach(vehicle => {
      this.selectedData.plates.push(vehicle.plate);
      this.selectedData.modelli.push(vehicle.model);
      if(vehicle.firstEvent){
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
