import { WorkSite } from './../../../Models/Worksite';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { MapService } from '../../../Common-services/map/map.service';
import { Observable, of, skip, Subject, takeUntil, tap, map, filter } from 'rxjs';
import { RealtimeData } from '../../../Models/RealtimeData';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { Vehicle } from '../../../Models/Vehicle';
import { MapFilterService } from '../../Services/map-filter/map-filter.service';
import { VehicleData } from '../../../Models/VehicleData';

@Component({
  selector: 'app-map-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatIconModule,
    MatOptionModule,
    MatSlideToggleModule
  ],
  templateUrl: './map-filter.component.html',
  styleUrl: './map-filter.component.css'
})
export class MapFilterComponent implements OnInit, AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  plate: string = "";

  targhe = new FormControl<string[]>([]);
  cantieri = new FormControl<string[]>([]);

  listaCantieri: string[] = [];
  listaTarghe: string[] = [];

  checked = true;
  disabled = false;
  private allSelected: boolean = false;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  constructor(
    private cantieriFilterService: CantieriFilterService,
    private plateFilterService: PlateFilterService,
    private sessionStorageService: SessionStorageService,
    private mapService: MapService,
    private mapFilterService: MapFilterService,
    private vehiclesApiService: VehiclesApiService,
    private cd: ChangeDetectorRef
  ){}
  ngOnInit(): void {
    // Monitora i cambiamenti nella selezione dei cantieri
    this.cantieri.valueChanges.subscribe(selectedCantieri => {
      if (!selectedCantieri || selectedCantieri.length === 0) {
        this.targhe.disable();  // Disabilita il controllo
        this.targhe.setValue([]); // Resetta la selezione
      } else {
        this.targhe.enable();  // Riabilita il controllo
      }
    });
  }

  ngAfterViewInit(): void {
    this.handleLoadPosition();
  }

  /**
   * Mette in attesa per il caricamento di una posizione sulla mappa,
   * per popolare i filtri con i dati del nuovo veicolo associato
   */
  private handleLoadPosition(){
    this.mapService.loadPosition$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (realtimeData: RealtimeData | null) => {
        if(realtimeData){
          const vehicle: {plate: string, veId: number, worksite?: WorkSite | null} = realtimeData.vehicle;
          let selectedTarghe = this.targhe.value;
          this.listaTarghe.push(vehicle.plate);
          this.listaTarghe.sort();

          if(selectedTarghe) this.targhe.setValue(["Seleziona tutto", ...selectedTarghe, vehicle.plate]);

          if(vehicle?.worksite && !this.listaCantieri.includes(vehicle.worksite.name)){
            let selectedCantieri = this.cantieri.value;
            this.listaCantieri.push(vehicle.worksite.name);
            this.listaCantieri.sort()
            if(selectedCantieri) this.cantieri.setValue(["Seleziona tutto", ...selectedCantieri, vehicle.worksite.name]);
          }
          this.allSelected = true;
          this.cd.detectChanges();
        }
      },
      error: error => console.error("Errore nel caricamento del veicolo nel filtro: ", error)
    });
  }

  /**
   * Seleziona tutte le opzioni del filtro per targhe
   */
  selectAllPlates(){
    this.getAvailableVehicles().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        const cantieriFilteredVehicles = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, this.cantieri.value || []);
        const plateToggle = this.plateFilterService.toggleAllPlatesWithVehicles(this.allSelected, cantieriFilteredVehicles);
        this.targhe.setValue(plateToggle.length > 0 ? ["Seleziona tutto", ...plateToggle] : plateToggle);

        this.allSelected = !this.allSelected;
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nella ricezione dei veicoli disponibili: ", error)
    });
  }

  /**
   * Seleziona tutte le opzioni del filtro per cantieri
   */
  selectAllCantieri(){
    this.getAvailableVehicles().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        const cantieriToggle = this.cantieriFilterService.toggleSelectAllCantieri(this.allSelected);
        this.cantieri.setValue(cantieriToggle.length > 0 ? ["Seleziona tutto", ...cantieriToggle] : cantieriToggle);

        this.allSelected = !this.allSelected;
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nella ricezione dei veicoli disponibili: ", error)
    });
  }

  /**
   * Gestisce la selezione di una targa dal filtro delle targhe
   */
  selectPlate(){
    this.getAvailableVehicles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (vehicles: Vehicle[]) => {
        const cantieriFilteredVehicles = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, this.cantieri.value || []);
        let allPlates: string[] = cantieriFilteredVehicles.map(vehicle => {
          if('vehicle' in vehicle){
            return vehicle.vehicle.plate
          }else{
            return vehicle.plate
          }
        });

        const selectedPlates = this.targhe.value?.filter(option => option !== "Seleziona tutto");
        if (selectedPlates) {
          if (JSON.stringify(allPlates.sort()) === JSON.stringify(selectedPlates.sort())) {
            this.allSelected = true;
            this.targhe.setValue(["Seleziona tutto", ...allPlates]);
          } else {
            this.allSelected = false;
            this.targhe.setValue(selectedPlates);
          }
        }
      },
      error: error => console.error("Errore nella richiesta per ottenere tutti i veicoli: ", error)
    });
  }

  /**
   * Gestisce la selezione di un cantiere
   */
  selectCantiere() {
    this.getAvailableVehicles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (vehicles: Vehicle[]) => {
        let allCantieri: string[] = this.cantieriFilterService.vehiclesCantieriOnce(vehicles);

        const selectedCantieri = this.cantieri.value?.filter(option => option !== "Seleziona tutto");
        const cantieriFiltredVehicles = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, selectedCantieri || []);

        this.listaTarghe = cantieriFiltredVehicles.map(vehicle => {
          if('vehicle' in vehicle){
            return vehicle.vehicle.plate
          }else{
            return vehicle.plate
          }
        });

        if (selectedCantieri) {
          if (JSON.stringify(allCantieri.sort()) === JSON.stringify(selectedCantieri.sort())) {
            this.allSelected = true;
            this.cantieri.setValue(["Seleziona tutto", ...allCantieri]);
          } else {
            this.allSelected = false;
            this.cantieri.setValue(selectedCantieri);
          }
        }
      },
      error: error => console.error("Errore nella richiesta per ottenere tutti i veicoli: ", error)
    });
  }


  /**
   * Permette di ottenere i veicoli disponibili
   * nel sessionstorage se disponibili altrimenti effettua una chiamata API
   * @returns observable<any[]>
   */
  private getAvailableVehicles(): Observable<any[]> {
    const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    let vehicles = allData || allVehicles;

    if (vehicles) {
      return of(vehicles); // Return cached data as an Observable
    } else {
      return this.vehiclesApiService.getAllVehicles().pipe(
        takeUntil(this.destroy$),
        tap((fetchedVehicles: Vehicle[]) => {
          this.sessionStorageService.setItem("allVehicles", JSON.stringify(fetchedVehicles));
        })
      );
    }
  }

  /**
   * Filtra i veicoli associati ai marker sulla mappa e
   * li aggiorna
   */
  updateData() {
    this.getAvailableVehicles().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (vehicles: Vehicle[]) => {
        const selectedPlates = this.targhe.value || [];
        const selectedCantieri = this.cantieri.value || [];
        let filteredVehicles: any[] = [];

        filteredVehicles = this.mapFilterService.filterVehiclesByPlatesAndCantieri(vehicles, selectedPlates, selectedCantieri);

        this.mapService.updateMarkers$.next(filteredVehicles);
      },
      error: (error) => console.error("Errore nella ricezione dei veicoli disponibili: ", error)
    });
  }



  /**
   * Permette di attivare e disattivare i popup sulla mappa
   */
  togglePlates(){
    this.mapService.togglePopups$.next();
  }
}
