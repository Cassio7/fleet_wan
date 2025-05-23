import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';
import { VehicleData } from '../../Models/VehicleData';
import { SessionStorageService } from '../sessionStorage/session-storage.service';

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

  private _allSelected: boolean = true;

  listaCantieri: string[] = [];


  constructor(
    private sessionStorageService: SessionStorageService,
  ) { }

  /**
   * Ritorna i nomi dei cantieri dei veicoli, presi solo una volta
   * @param vehicles veicoli da cui prendere i nomi dei cantieri assegnati
   * @returns array di nomi di cantieri
   */
  vehiclesCantieriOnce(vehicles: (VehicleData | Vehicle)[]): string[] {
    let seen = new Set<string>();
    let listaCantieri: string[] = [];

    // Mappa e filtra i dati in base al tipo di ciascun elemento
    if(listaCantieri){
      listaCantieri = vehicles
      .map(vehicle => {
        // Verifica se è un VehicleData e ottieni il worksite
        let worksite = 'vehicle' in vehicle ? vehicle.vehicle.worksite : (vehicle as Vehicle).worksite;

        if (!worksite) return 'Libero';

        let name = worksite.name?.toLowerCase();
        return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Libero';
      })
      .filter((name): name is string => {
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });
    }else{
      listaCantieri = [];
    }

    return listaCantieri;
  }


  /**
   * Filtra un array di veicoli in base al valore del filtro sui cantieri
   * @param vehicles veicoli sui quali applicare il filtro
   * @param worksites cantieri per cui filtrare
   * @returns array di veicoli filtrati
   */
  filterVehiclesByCantieri(vehiclesData: (VehicleData | Vehicle)[], worksites: string[]): (VehicleData | Vehicle)[] {
    const cantieri: string[] = worksites || [];

    if (cantieri.length === 0) {
      // If no worksites are selected, return the original array or an empty array
      return vehiclesData;
    }

    const cantieriLower = cantieri
      .filter(cantiere => typeof cantiere === "string") // Filter out non-string items
      .map(cantiere => cantiere.toLowerCase()); // Convert worksites to lowercase

    return vehiclesData.filter(vehicle => {
      // Determine the worksite name based on the type of vehicle object
      let workSiteName: string | undefined;
      if ('vehicle' in vehicle && vehicle.vehicle.worksite) {
        workSiteName = vehicle.vehicle.worksite.name;
      } else if ('worksite' in vehicle && vehicle.worksite) {
        workSiteName = vehicle.worksite.name;
      }

      if (typeof workSiteName !== 'string') {
        return true // Skip if worksite name is invalid or not present
      }

      return cantieriLower.includes(workSiteName.toLowerCase());
    });
  }

  /**
   * Permette di ottenere il cantiere di un veicolo senza rischio di errori
   * @param vehicle veicolo di tipo Vehicle | VehicleData
   * @returns stringa del nome del cantiere, altrimenti stringa "non assegnato"
   */
  getVehicleWorksite(vehicle: Vehicle | VehicleData): string {
    const worksite = 'vehicle' in vehicle ? vehicle.vehicle?.worksite : vehicle.worksite;
    return worksite?.name ?? 'Non assegnato';
  }

  /**
   * Filtra i veicoli in base ai modelli dei veicoli selezionati.
   * @param selectedModels - Array di modelli selezionati.
   * @param vehicles - Array di veicoli da filtrare.
   * @returns Un array di veicoli che corrispondono ai modelli selezionati.
   */
  filterVehiclesByModel(selectedModels: string[], vehiclesData: VehicleData[]): any[] {
    const vehicles = vehiclesData.map(obj => {
      return obj.vehicle;
    });
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
  filterVehiclesCantieriDuplicates(vehiclesData: (VehicleData | Vehicle)[]): any[] {
    const vehicles = vehiclesData.map(obj => {
      return 'vehicle' in obj ? obj.vehicle : obj; // Prende direttamente il veicolo da VehicleData o Vehicle
    });

    const seenCantieri = new Set<string>(); // Set per tracciare i cantieri unici

    return vehicles.filter(vehicle => {
      const worksiteName = 'worksite' in vehicle && vehicle.worksite?.name ? vehicle.worksite.name : "non assegnato";

      if (seenCantieri.has(worksiteName)) {
        return false; // Se il cantiere è già stato visto, lo salta
      }

      seenCantieri.add(worksiteName); // Aggiunge il cantiere al Set
      return true; // Altrimenti, mantiene il veicolo
    });
  }


  /**
   * Aggiorna le opzioni presenti nel filtro dei cantieri (getsisce l'opzione "Seleziona tutto")
   * @param vehicles veicoli da cui prendere i cantieri
   * @returns lista dei cantieri selezionati
   */
  updateListaCantieri(vehicles: (VehicleData | Vehicle)[]): string[] {
    if (!vehicles.length) {
      console.error("Array di veicoli è vuoto:", vehicles);
      return [];
    }

    const firstElement = this.listaCantieri[0] || null;
    const newCantieri = this.vehiclesCantieriOnce(vehicles) || [];

    this.listaCantieri = firstElement ? [firstElement, ...newCantieri] : newCantieri;
    return this.listaCantieri;
  }


  updateSelectedCantieri(vehicles: (VehicleData | Vehicle)[]): string[]{
    const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
    const allCantieri = this.vehiclesCantieriOnce(allData);
    const selectedCantieri = this.vehiclesCantieriOnce(vehicles);

    if(JSON.stringify(selectedCantieri) == JSON.stringify(allCantieri)){
      selectedCantieri.push("Seleziona tutto");
      this.allSelected = true;
    }else{
      this.allSelected = false;
    }

    this.updateCantieriFilterOptions$.next(selectedCantieri);

    return selectedCantieri;
  }

  /**
   * Seleziona / deseleziona tutti i cantieri dei veicoli nel select e notifica la tabella di aggiornare i dati
   * @param selectionState stato di selezione del componente chiamante
   * @returns nuovo valore della lista cantieri
   */
  toggleSelectAllCantieri(vehicles: (Vehicle | VehicleData)[], selectionState: boolean){
    const allCantieri = this.vehiclesCantieriOnce(vehicles);
    if (selectionState) {
      this.filterTableByCantiere$.next([]);
      return [];
    } else {
      this.filterTableByCantiere$.next(allCantieri);
      return allCantieri;
    }
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
