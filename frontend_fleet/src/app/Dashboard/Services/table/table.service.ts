import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private _filterTableByCantiere$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor() { }



  filterTableByCantieri(vehicles: any[], cantieri: string[]){
    const allVehicles = vehicles;
    console.log("Tutti i veicoli: ", allVehicles);

    if(cantieri.includes("Seleziona tutto")){
      return allVehicles; //Ritorna tutti i veicoli
    }

    //Se è stata selezionata un'opzione e non è la selezione di tutto, filtra in base all'opzione
    if(cantieri.length > 0){
      const cantieriLower = cantieri.map(cantiere => cantiere.toLowerCase()); //Array di cantieri trasformato con lettere tutte minuscole

      //filtro veicoli in base a cantieri selezionati
      const filteredVehicles = vehicles.filter(veicolo => {
        const workSiteLower = veicolo.worksite?.name.toLowerCase(); //nome del cantiere di appartenza del veicolo
        return cantieriLower.includes(workSiteLower);
      });
      return filteredVehicles; // Ritorna array di dati filtrati
    }else{//Se nessuna opzione è stata selezionata
      return []; //Ritorna un array vuoto
    }

  }

  public get filterTableByCantiere$(): BehaviorSubject<string[]> {
    return this._filterTableByCantiere$;
  }
}
