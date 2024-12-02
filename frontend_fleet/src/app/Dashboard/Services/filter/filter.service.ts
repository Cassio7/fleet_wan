import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { SessionStorageService } from '../../../Common services/sessionStorage/session-storage.service';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private _updateFilterOptions$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  private _filterTableByCantiere$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  constructor(
    private sessionStorageService: SessionStorageService
  ) { }

  /**
   * Inizializza il select per i filtri con i nomi di cantieri a cui i veicoli sono assegnati presi una sola volta
   * @param vehicles veicoli da cui prendere i nomi dei cantieri assegnati
   * @returns array di nomi di cantieri
   */
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



  /**
   * Permette di riempire la tabella in base al filtro applicato
   * @param vehicles veicoli sui quali applicare il filtro
   * @param cantieri nomi di cantieri presenti nel filtro
   * @returns array di veicoli filtrati
   */
  filterTableByCantieri(vehicles: any[], cantieri: string[]) {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));

    if (cantieri.includes("Seleziona tutto")) {
      return vehicles; // Ritorna tutti i veicoli
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
  public get updateFilterOptions$(): BehaviorSubject<any[]> {
    return this._updateFilterOptions$;
  }
}
