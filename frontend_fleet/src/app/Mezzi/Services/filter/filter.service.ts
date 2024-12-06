import { Injectable } from '@angular/core';
import { Vehicle } from '../../../Models/Vehicle';
import { selectedData } from '../select/select.service';

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  constructor() { }

  filterColumns(selectedData: selectedData, vehicles: Vehicle[]){
    //array per i valori delle colonne
    const plates: string[] = [];
    //iterarazione sui veicoli
    vehicles.forEach(vehicle => {
      plates.push(vehicle.plate)//riempimento array di targhe dei veicoli
    });


    //ritorna filter per ogni veiolo e rimozione dei veicoli che non rispettano criteri
    return vehicles.filter(vehicle => {
      return selectedData.plates.includes(vehicle.plate);
    });
  }
}
