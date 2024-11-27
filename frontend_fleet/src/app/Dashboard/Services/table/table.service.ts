import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private _filterTableByCantiere$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor() { }

  fillSelect(vehicles: any[]) {
    let seen = new Set<string>();
    let listaCantieri = vehicles
      .map(vehicle => {
        let name = vehicle.worksite?.name?.toLowerCase();
        return name ? name.charAt(0).toUpperCase() + name.slice(1) : undefined;
      })
      .filter(name => {
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
    return listaCantieri;
  }




  filterTableByCantieri(vehicles: any[], cantieri: string[]) {
    let allVehicles: any[] = [];

    if (typeof sessionStorage !== "undefined") {
      allVehicles = JSON.parse(sessionStorage.getItem("allVehicles") || "[]"); // Usa un array vuoto come fallback
    }

    if (cantieri.includes("Seleziona tutto")) {
      return allVehicles; // Ritorna tutti i veicoli
    }

    // Se è stata selezionata un'opzione e non è la selezione di tutto, filtra in base all'opzione
    if (cantieri.length > 0) {
      const cantieriLower = cantieri
        .filter(cantiere => typeof cantiere === "string") // Filtra solo stringhe
        .map(cantiere => cantiere.toLowerCase()); // Array di cantieri trasformato con lettere tutte minuscole

      // Filtro veicoli in base a cantieri selezionati
      const filteredVehicles = vehicles.filter(veicolo => {
        const workSiteName = veicolo.worksite?.name;
        if (typeof workSiteName !== "string") return false; // Salta elementi non validi
        const workSiteLower = workSiteName.toLowerCase(); // Nome del cantiere di appartenenza del veicolo
        return cantieriLower.includes(workSiteLower);
      });

      return filteredVehicles; // Ritorna array di dati filtrati
    } else {
      // Se nessuna opzione è stata selezionata
      return []; // Ritorna un array vuoto
    }
  }

  public get filterTableByCantiere$(): BehaviorSubject<string[]> {
    return this._filterTableByCantiere$;
  }

}
