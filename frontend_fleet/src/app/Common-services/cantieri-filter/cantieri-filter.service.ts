import { Injectable } from '@angular/core';
import { BlackboxGraphsService } from '../../Dashboard/Services/blackbox-graphs/blackbox-graphs.service';
import { ErrorGraphsService } from '../../Dashboard/Services/error-graphs/error-graphs.service';
import { SessionStorageService } from '../sessionStorage/session-storage.service';
import { VehicleData } from '../../Models/VehicleData';
import { BehaviorSubject } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';

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
  vehiclesCantieriOnce(vehicles: (VehicleData | Vehicle)[]): string[] {
    let seen = new Set<string>();
    let listaCantieri: string[] = [];

    // Mappa e filtra i dati in base al tipo di ciascun elemento
    listaCantieri = vehicles
      .map(vehicle => {
        // Verifica se è un VehicleData e ottieni il worksite
        let worksite = 'vehicle' in vehicle ? vehicle.vehicle.worksite : (vehicle as Vehicle).worksite;

        if (!worksite) return null;

        let name = worksite.name?.toLowerCase();
        return name ? name.charAt(0).toUpperCase() + name.slice(1) : null;
      })
      .filter((name): name is string => {
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
      });

    return listaCantieri;
  }


  /**
   * Filtra un array di veicoli in base al valore del filtro sui cantieri
   * @param vehicles veicoli sui quali applicare il filtro
   * @param worksites cantieri per cui filtrare (presenza di opzione "Seleziona tutto" gestita)
   * @returns array di veicoli filtrati
   */
  filterVehiclesByCantieri(vehiclesData: VehicleData[], worksites: string[]): VehicleData[] {
    const cantieri: string[] = worksites || [];
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allData"));

    if (cantieri.includes("Seleziona tutto")) {
      if (this.errorGraphsService.checkBlackBoxSlice()) {
        return this.errorGraphsService.checkBlackBoxSlice();
      }

      if (this.blackboxGraphsService.checkErrorGraphSlice()) {
        return this.blackboxGraphsService.checkErrorGraphSlice();
      }

      return allVehicles; // Return all vehicles
    }

    // If one or more worksite options are selected, filter based on the selected worksites
    if (cantieri.length > 0) {
      const cantieriLower = cantieri
        .filter(cantiere => typeof cantiere === "string") // Filter out non-string items
        .map(cantiere => cantiere.toLowerCase()); // Convert worksites to lowercase

      // Filter the VehicleData array based on the selected worksites
      const filteredVehicles = vehiclesData.filter(vehicleData => {
        const workSiteName = vehicleData.vehicle.worksite?.name;
        if (typeof workSiteName !== "string") return false; // Skip invalid worksite names
        const workSiteLower = workSiteName.toLowerCase(); // Worksite name in lowercase
        return cantieriLower.includes(workSiteLower);
      });

      return filteredVehicles; // Return filtered VehicleData array
    } else {
      // If no worksites are selected, return an empty array
      return []; // Return an empty array
    }
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
   * Aggiorna le opzioni presenti nel filtro dei cantieri
   * @param vehicles veicoli da cui prendere i cantieri
   * @returns lista dei cantieri selezionati
   */
  updateListaCantieri(vehicles: VehicleData[]): string[]{
    if (Array.isArray(vehicles) && vehicles.length > 0) {
      const firstElement = this.listaCantieri[0] || null; // Elemento preesistente o null
      const newCantieri = this.vehiclesCantieriOnce(vehicles) || [];

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
