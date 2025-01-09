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
    const seen = new Set<string>();
    const listaCantieri = vehicles
      .map(item => {
        //determina il nome del cantiere a seconda del tipo
        const name =
          'vehicle' in item //se è di tipo VehicleData
            ? item.vehicle.worksite?.name?.toLowerCase()
            : item.worksite?.name?.toLowerCase(); //se è di tipo Vehicle

        return name ? name.charAt(0).toUpperCase() + name.slice(1) : null; //ritorna null invece di undefined
      })
      .filter((name): name is string => {
        if (!name || seen.has(name)) return false; //salta duplicati o valori nulli
        seen.add(name); //aggiunge al Set
        return true; //mantiene il valore
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
  filterVehiclesByCantieri(vehiclesData: (VehicleData | Vehicle)[], worksites: string[]) {
    const cantieri: string[] = worksites || [];
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allData"));

    // Se è stata selezionata l'opzione "Seleziona tutto"
    if (cantieri.includes("Seleziona tutto")) {
      if (this.errorGraphsService.checkBlackBoxSlice()) {
        return this.errorGraphsService.checkBlackBoxSlice();
      }

      if (this.blackboxGraphsService.checkErrorGraphSlice()) {
        return this.blackboxGraphsService.checkErrorGraphSlice();
      }

      return allVehicles; // Ritorna tutti i veicoli
    }

    // Se sono stati selezionati dei cantieri
    if (cantieri.length > 0) {
      // Prepara l'array dei cantieri selezionati in minuscolo per il confronto
      const cantieriLower = cantieri
        .filter(cantiere => typeof cantiere === "string") // Filtra solo stringhe
        .map(cantiere => cantiere.toLowerCase());

      // Filtro veicoli in base ai cantieri selezionati
      const filteredVehicles = vehiclesData.filter(item => {
        let worksiteName: string | undefined;

        if ('vehicle' in item) { // Se è di tipo VehicleData
          worksiteName = item.vehicle.worksite?.name;
        } else if ('worksite' in item) { // Se è di tipo Vehicle
          worksiteName = item.worksite?.name;
        }

        if (typeof worksiteName !== "string") return false; // Salta veicoli senza nome del cantiere valido
        const worksiteLower = worksiteName.toLowerCase(); // Nome del cantiere del veicolo in minuscolo
        return cantieriLower.includes(worksiteLower);
      });

      return filteredVehicles; // Ritorna i veicoli filtrati
    }

    // Se nessun cantiere è selezionato, ritorna un array vuoto
    return []; // Ritorna un array vuoto
  }



  /**
   * Filtra i veicoli in base ai modelli dei veicoli selezionati.
   * @param selectedModels - Array di modelli selezionati.
   * @param vehicles - Array di veicoli da filtrare.
   * @returns Un array di veicoli che corrispondono ai modelli selezionati.
   */
  filterVehiclesByModel(selectedModels: string[], vehiclesData: (VehicleData | Vehicle)[]): any[] {
    if (!selectedModels || !selectedModels.length) {
      return vehiclesData; //return all vehicles if no cantieri are selected.
    }

    const modelsSet = new Set(selectedModels);

    return vehiclesData.filter(item => {
      const worksiteName =
        'vehicle' in item //se è di tipo VehicleData
          ? item.vehicle.worksite?.name
          : item.worksite?.name; //se è di tipo Vehicle

      return worksiteName ? modelsSet.has(worksiteName) : false; //verifica se il nome del cantiere è in modelsSet
    });
  }


  /**
   * Filtra i cantieri duplicati
   * @param vehicles veicoli dai quali prendere i modelli
   * @returns array di veicoli filtrati
   */
  filterVehiclesCantieriDuplicates(vehiclesData: (VehicleData | Vehicle)[]): any[] {
    const seenCantieri = new Set<string>();

    return vehiclesData.filter(item => {
      const worksiteName =
        'vehicle' in item //se è di tipo VehicleData
          ? item.vehicle.worksite?.name ?? "non assegnato"
          : item.worksite?.name ?? "non assegnato"; //se è di tipo Vehicle

      //controllo se il cantiere è già stato visto
      if (seenCantieri.has(worksiteName)) {
        return false; //skip
      }

      seenCantieri.add(worksiteName);
      return true; //mantenere elemento
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
