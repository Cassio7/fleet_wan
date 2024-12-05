import { Injectable } from '@angular/core';
import { Vehicle } from '../../Models/Vehicle';

export interface selectedData {
  plates: any[];
  modelli: any[];
  firstEvents: Date[];
}
@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private selectedData: selectedData = {
    plates: [],
    modelli: [],
    firstEvents: []
  }
  constructor() { }

  selectAllOptions(){

  }

  /**
   * Aggiunge una targa all'array di targhe selezionate
   * @param plate targa da aggiungere
   */
  addPlateSelection(plate: string){
    this.selectedData.plates.push(plate);
  }

}
