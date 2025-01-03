import { Injectable } from '@angular/core';
import { BlackboxGraphsService } from '../../Dashboard/Services/blackbox-graphs/blackbox-graphs.service';
import { ErrorGraphsService } from '../../Dashboard/Services/error-graphs/error-graphs.service';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { Vehicle } from '../../Models/Vehicle';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CantieriFilterService{

  /**
   * Trasporta un array di veicoli dai quali poi estrapolare i cantieri per riempire il filtro dei cantieri
   */
  private readonly _updateCantieriFilterOptions$: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  /**
   * Trasporta le opzioni selezionate del filtro dei cantieri e notifica la tabella di filtrare i dati in base ai cantieri ottenuti
   */
  private readonly _filterTableByCantiere$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

  private _allSelected: boolean = false;

  listaCantieri: string[] = ["Seleziona tutto"];


  constructor(
    private sessionStorageService: SessionStorageService,
    private errorGraphsService: ErrorGraphsService,
    private blackboxGraphsService: BlackboxGraphsService
  ) { }

  /**
   * Ritorna i nomi dei cantieri dei veicoli, presi solo una volta
   * @param vehicles veicoli da cui prendere i nomi dei cantieri assegnati
   * @returns array di nomi di cantieri
   */
  vehiclesCantieriOnce(vehicles: any[]): string[] {
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
    this.listaCantieri = ["Seleziona tutto", ...listaCantieri];
    return listaCantieri;
  }

  /**
   * Filtra un array di veicoli in base al valore del filtro sui cantieri
   * @param vehicles veicoli sui quali applicare il filtro
   * @param worksites cantieri per cui filtrare (se passato un array vuoto, utilizza i cantieri salvati nel sessionstorage)
   * @returns array di veicoli filtrati
   */
  filterVehiclesByCantieri(vehicles:  Vehicle[], worksites: string[]) {
    const cantieri: string[] = worksites || [];
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));

    if (cantieri.includes("Seleziona tutto")) {
      if(this.errorGraphsService.checkBlackBoxSlice()){
        return this.errorGraphsService.checkBlackBoxSlice();
      }

      if(this.blackboxGraphsService.checkErrorGraphSlice()){
        return this.blackboxGraphsService.checkErrorGraphSlice();
      }

      return allVehicles;// Ritorna tutti i veicoli
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

  /**
   * Filtra i veicoli in base ai modelli dei veicoli selezionati.
   * @param selectedModels - Array di modelli selezionati.
   * @param vehicles - Array di veicoli da filtrare.
   * @returns Un array di veicoli che corrispondono ai modelli selezionati.
   */
  filterVehiclesByModel(selectedModels: string[], vehicles: Vehicle[]): Vehicle[] {
    if (!selectedModels || !selectedModels.length) {
      return vehicles; // Return all vehicles if no cantieri are selected.
    }

    const modelsSet = new Set(selectedModels);

    return vehicles.filter(vehicle => {
      const worksiteName = vehicle.worksite?.name;
      return worksiteName ? modelsSet.has(worksiteName) : false;
    });
  }

  /**
   * Filtra i cantieri duplicati
   * @param vehicles veicoli dai quali prendere i modelli
   * @returns array di veicoli filtrati
   */
  filterVehiclesCantieriDuplicates(vehicles: Vehicle[]) {
    const seenCantieri = new Set<string>(); // Set per tracciare i cantieri unici
    return vehicles.filter(vehicle => {
      if (vehicle.worksite) {
        if (seenCantieri.has(vehicle.worksite.name)) {
          return false;
        }
        seenCantieri.add(vehicle.worksite.name);
        return true;
      } else {
        // Se il worksite è null o undefined, usa "non assegnato"
        if (seenCantieri.has("non assegnato")) {
          return false;
        }
        seenCantieri.add("non assegnato");
        return true;
      }
    });
  }

  /**
   * Aggiorna le opzioni presenti nel filtro dei cantieri
   * @param vehicles veicoli da cui prendere i cantieri
   * @returns lista dei cantieri selezionati
   */
  updateListaCantieri(vehicles: Vehicle[]): string[]{
    if (Array.isArray(vehicles) && vehicles.length > 0) {
      const firstElement = this.listaCantieri[0] || null; // Elemento preesistente o null
      const newCantieri = this.fillSelect(vehicles);

      this.listaCantieri = firstElement ? [firstElement, ...newCantieri] : newCantieri;
      return this.listaCantieri;
    } else {
      console.error("Array di veicoli non valido o vuoto:", vehicles);
      return [];
    }
  }

  /**
   * Seleziona / deseleziona tutti i cantieri dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllCantieri(){
    if (this.allSelected) {
      this.filterTableByCantiere$.next([]);
      this.allSelected = false
      return [];
    } else {
      this.filterTableByCantiere$.next(this.listaCantieri);
      this.allSelected = true
      return this.listaCantieri;
    }
  }

  /**
   * Inizializza il select per i filtri con i nomi di cantieri a cui i veicoli sono assegnati presi una sola volta
   * @returns array di nomi di cantieri
   */
  private fillSelect(vehicles: any[]){
    return vehicles ? this.vehiclesCantieriOnce(vehicles) : [];
  }

  /**
   * controlla se i cantieri sono tutti selezionati
   * @returns true se tutti selezionati
   * @returns false se non sono tutti selezionati
   */
  isCantieriAllSelected(): boolean{
    return this.allSelected;
  }

  public get updateCantieriFilterOptions$(): BehaviorSubject<any[]> {
    return this._updateCantieriFilterOptions$;
  }
  public get filterTableByCantiere$(): BehaviorSubject<string[]> {
    return this._filterTableByCantiere$;
  }
  public get allSelected(): boolean {
    return this._allSelected;
  }
  public set allSelected(value: boolean) {
    this._allSelected = value;
  }
}
