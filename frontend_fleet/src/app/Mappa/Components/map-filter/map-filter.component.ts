import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { map, Observable, of, startWith, Subject, takeUntil, tap } from 'rxjs';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { MapService } from '../../../Common-services/map/map.service';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { RealtimeData } from '../../../Common-services/realtime-api/realtime-api.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { Vehicle } from '../../../Models/Vehicle';
import { VehicleData } from '../../../Models/VehicleData';
import { MapFilterService } from '../../Services/map-filter/map-filter.service';
import { WorkSite } from './../../../Models/Worksite';

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
    MatTooltipModule,
    MatOptionModule,
    MatAutocompleteModule,
    MatSlideToggleModule
  ],
  templateUrl: './map-filter.component.html',
  styleUrl: './map-filter.component.css'
})
export class MapFilterComponent implements OnInit, AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  plateControl = new FormControl("");
  plateObservable$!: Observable<string[]>;

  targheControl = new FormControl<string[]>([]);
  cantieriControl = new FormControl<string[]>([]);

  listaCantieri: string[] = [];
  listaTarghe: string[] = [];

  mapVehicles: any[] = [];

  cantieriSelectOpened: boolean = false;
  targheSelectOpened: boolean = false;

  visiblePlates = false;
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
    this.cantieriControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(selectedCantieri => {
      if (!selectedCantieri || selectedCantieri.length === 0) {
        this.targheControl.disable();
        this.plateControl.enable();
        this.targheControl.setValue([]);
      } else {
        this.targheControl.enable();
        this.plateControl.disable();
      }
    });

    this.plateObservable$ = this.plateControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterPlates(value || '')),
    );
  }

  ngAfterViewInit(): void {
    this.handleLoadPosition();
    this.handleMultipleVehiclePositions();
    this.mapService.updateMarkers$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.visiblePlates = false;
      },
      error: error => console.error("Errore nella notifica di aggiornamento dei marker: ", error)
    });
  }

  /**
   * Gestisce l'attivazione e disattivazione dei form per targa (selezione checkbox) e per cantiere
   */
  toggleForms(){
    if(this.plateControl.value && this.plateControl.value.length > 0){
      this.targheControl.disable();
      this.cantieriControl.disable();
    }else{
      this.targheControl.enable();
      this.cantieriControl.enable();
    }
  }

  /**
   * Filtra un array di stringhe (targhe) in base al valore di ricerca passato, ignorando maiuscole, minuscole e spazi bianchi
   * @param value valore da cercare (ignorando case e spazi bianchi)
   * @returns array di stringhe filtrato che contiene solo le targhe che includono il valore di ricerca
   */
  private filterPlates(value: string): string[] {
    const filterValue = value.toLowerCase().replace(/\s/g, '');
    return this.listaTarghe.filter(plate => this._normalizeValue(plate).includes(filterValue));
  }

  /**
   * Normalizza la stringa passata, rimuovendo tutti gli spazi bianchi e convertendo i caratteri in minuscolo
   * @param value stringa da normalizzare
   * @returns stringa normalizzata in minuscolo e senza spazi bianchi
   */
  private _normalizeValue(value: string): string {
    return value?.toLowerCase().replace(/\s/g, '') || '-';
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
          this.mapVehicles.push(vehicle);
          let selectedTarghe = this.targheControl.value;
          if(!this.listaTarghe.includes(vehicle.plate)) this.listaTarghe.push(vehicle.plate);
          this.listaTarghe.sort();

          if(selectedTarghe) this.targheControl.setValue(["Seleziona tutto", ...selectedTarghe, vehicle.plate]);

          if(vehicle?.worksite && !this.listaCantieri.includes(vehicle.worksite.name)){
            let selectedCantieri = this.cantieriControl.value;
            this.listaCantieri.push(vehicle.worksite.name);
            this.listaCantieri.sort()
            if(selectedCantieri) this.cantieriControl.setValue(["Seleziona tutto", ...selectedCantieri, vehicle.worksite.name.toLocaleLowerCase()]);
          }
          this.allSelected = true;
          this.cd.detectChanges();
        }
      },
      error: error => console.error("Errore nel caricamento del veicolo nel filtro: ", error)
    });
  }

  /**
   * Mette in attesa per il caricamento di una posizione sulla mappa,
   * per popolare i filtri con i dati del nuovo veicolo associato
   */
  private handleMultipleVehiclePositions() {
    this.mapService.loadMultipleVehiclePositions$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (realtimeData: RealtimeData[]) => {
          if (realtimeData) {
            const updatedTarghe: string[] = [];
            const updatedCantieri: string[] = [];

            realtimeData.forEach(data => {
              const vehicle: { plate: string, veId: number, worksite?: WorkSite | null } = data.vehicle;

              this.mapVehicles.push(vehicle);

              if (!this.listaTarghe.includes(vehicle.plate)) {
                this.listaTarghe.push(vehicle.plate);
                updatedTarghe.push(vehicle.plate);
              }

              if (vehicle?.worksite && !this.listaCantieri.includes(vehicle.worksite.name)) {
                this.listaCantieri.push(vehicle.worksite.name);
                updatedCantieri.push(vehicle.worksite.name.toLocaleLowerCase());
              }
            });

            this.listaTarghe.sort();
            this.listaCantieri.sort();

            const selectedTarghe = this.targheControl.value || [];
            if (updatedTarghe.length > 0) {
              this.targheControl.setValue(["Seleziona tutto", ...selectedTarghe, ...updatedTarghe]);
            }

            const selectedCantieri = this.cantieriControl.value || [];
            if (updatedCantieri.length > 0) {
              this.cantieriControl.setValue(["Seleziona tutto", ...selectedCantieri, ...updatedCantieri]);
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
        const cantieriFilteredVehicles = this.cantieriFilterService.filterVehiclesByCantieri(this.mapVehicles, this.cantieriControl.value || []);
        const plateToggle = this.plateFilterService.toggleAllPlatesWithVehicles(this.allSelected, cantieriFilteredVehicles);
        this.targheControl.setValue(plateToggle.length > 0 ? ["Seleziona tutto", ...plateToggle] : plateToggle);

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
        const cantieriToggle = this.cantieriFilterService.toggleSelectAllCantieri(this.mapVehicles, this.allSelected).map(cantiere => cantiere.toLocaleLowerCase());
        console.log("listaCantieri: ", this.listaCantieri);
        console.log("cantieriToggle: ", cantieriToggle);
        this.cantieriControl.setValue(cantieriToggle.length > 0 ? ["Seleziona tutto", ...cantieriToggle] : cantieriToggle);

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
        const cantieriFilteredVehicles = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, this.cantieriControl.value || []);
        let allPlates: string[] = cantieriFilteredVehicles.map(vehicle => {
          if('vehicle' in vehicle){
            return vehicle.vehicle.plate
          }else{
            return vehicle.plate
          }
        });

        const selectedPlates = this.targheControl.value?.filter(option => option !== "Seleziona tutto");
        if (selectedPlates) {
          if (JSON.stringify(allPlates.sort()) === JSON.stringify(selectedPlates.sort())) {
            this.allSelected = true;
            this.targheControl.setValue(["Seleziona tutto", ...allPlates]);
          } else {
            this.allSelected = false;
            this.targheControl.setValue(selectedPlates);
          }
        }
      },
      error: error => console.error("Errore nella richiesta per ottenere tutti i veicoli: ", error)
    });
  }

  /**
   * Filtra i veicoli per una ricerca per targa dal filtro di ricerca per targa singola
   * @param vehicles veicoli su cui ricercare
   * @returns veicolo con la targa richiesta
   */
  searchPlate(vehicles: (Vehicle | VehicleData)[]): (Vehicle | VehicleData) | null {
    let selectedVehicle: (Vehicle | VehicleData) | null = null;

    if (this.plateControl.value) {
        selectedVehicle = this.plateFilterService.filterVehiclesByPlateResearch(this.plateControl.value, vehicles)[0] || null;
    }

    return selectedVehicle;
  }


  /**
   * Gestisce la selezione di un cantiere
   */
  selectCantiere() {
    this.getAvailableVehicles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (vehicles: Vehicle[]) => {
        let allCantieri: string[] = this.cantieriFilterService.vehiclesCantieriOnce(vehicles);

        const selectedCantieri = this.cantieriControl.value?.filter(option => option !== "Seleziona tutto");
        const cantieriFiltredVehicles = this.cantieriFilterService.filterVehiclesByCantieri(vehicles, selectedCantieri || []);

        this.listaTarghe = cantieriFiltredVehicles.map(vehicle => {
          if('vehicle' in vehicle){
            return vehicle.vehicle.plate;
          }else{
            return vehicle.plate;
          }
        });

        if (selectedCantieri) {
          if (JSON.stringify(allCantieri.sort()) === JSON.stringify(selectedCantieri.sort())) {
            this.allSelected = true;
            this.cantieriControl.setValue(["Seleziona tutto", ...allCantieri]);
          } else {
            this.allSelected = false;
            this.cantieriControl.setValue(selectedCantieri);
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
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));

    if (allVehicles) {
      return of(allVehicles); // Return cached data as an Observable
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
    const selectedPlates = this.targheControl.value || [];
    const selectedCantieri = this.cantieriControl.value || [];
    this.getAvailableVehicles().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (vehicles: (Vehicle | VehicleData)[]) => {
        let filteredVehicles: any[] = [];
        if(this.plateControl.value && this.plateControl.value.length > 0){
          filteredVehicles = [this.searchPlate(vehicles)];
        }else{
          filteredVehicles = this.mapFilterService.filterVehiclesByPlatesAndCantieri(vehicles, selectedPlates, selectedCantieri);
        }
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
