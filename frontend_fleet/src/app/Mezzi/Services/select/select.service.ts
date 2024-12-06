import { Injectable } from '@angular/core';


export interface selectedData {
  plates: any[];
  modelli: any[];
  firstEvents: Date[];
}

@Injectable({
  providedIn: 'root'
})
export class SelectService {

  private _selectedData: selectedData = {
    plates: [],
    modelli: [],
    firstEvents: []
  };

  constructor() { }

  /**
   * Seleziona o deseleziona tutte le opzioni nel menù di una colonna
   * @param column nome colonna
   */
  selectDeselectAllColumnOptions(column: string){
    switch(column){
      case 'plates':
        //seleziona tutte le targhe
        break;
    }
  }

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

  public get selectedData(): selectedData {
    return this._selectedData;
  }
  public set selectedData(value: selectedData) {
    this._selectedData = value;
  }
}
