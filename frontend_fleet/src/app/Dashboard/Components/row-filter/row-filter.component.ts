import { ErrorGraphsService } from './../../Services/error-graphs/error-graphs.service';
import { SessionFilterService } from './../../../Common-services/session-filter/session-filter.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { forkJoin, merge, skip, Subject, take, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { GpsFilterService } from '../../../Common-services/gps-filter/gps-filter.service';
import { AntennaFilterService } from '../../../Common-services/antenna-filter/antenna-filter.service';
import { VehicleData } from '../../../Models/VehicleData';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';

@Component({
  selector: 'app-row-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
    MatOptionModule,
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './row-filter.component.html',
  styleUrl: './row-filter.component.css'
})

export class RowFilterComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  filterForm!: FormGroup;
  cantieri = new FormControl<string[]>([]);
  gps = new FormControl<string[]>([]);
  antenne = new FormControl<string[]>([]);
  sessionStates = new FormControl<string[]>([]);

  private _filters: Filters = {
    plate: "",
    cantieri: this.cantieri,
    gps: this.gps,
    antenna: this.antenne,
    sessione: this.sessionStates
  };


  constructor(
    public filtersCommonService: FiltersCommonService,
    public cantieriFilterService: CantieriFilterService,
    public gpsFilterService: GpsFilterService,
    public antennaFilterService: AntennaFilterService,
    private kanabanTableService: KanbanTableService,
    private kanbanGpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService,
    public sessionFilterService: SessionFilterService,
    private cantiereFilterService: CantieriFilterService,
    private checkErrorsService: CheckErrorsService,
    private errorGraphService: ErrorGraphsService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef) {
    this.filterForm = new FormGroup({
      cantiere: new FormControl(''),
      targa: new FormControl(''),
      range: new FormGroup({
        start: new FormControl(new Date()),
        end: new FormControl(new Date())
      })
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {

    this.toggleSelectAll();

    this.handleKanbanChange();

    this.handleAllFiltersOptionsUpdate();
    this.handleErrorGraphClick();

    // Aggiornamento del change detection (solitamente solo se ci sono modifiche dirette al DOM)
    this.cd.detectChanges();
  }

  private handleKanbanChange(){
    this.kanabanTableService.loadKabanTable$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe(() => {
      this.toggleSelectAll();
    });
    this.kanbanGpsService.loadKanbanGps$.pipe(takeUntil(this.destroy$))
    .subscribe(()=>{
      this.toggleSelectAll();
    });
    this.kanbanAntennaService.loadKanbanAntenna$.pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.toggleSelectAll();
    });
  }

  private handleAllFiltersOptionsUpdate(){
    // Sottoscrizione per il filtro cantieri
    this.cantiereFilterService.updateCantieriFilterOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedCantieri: string[]) => {
        this.cantieri.setValue(selectedCantieri);
      },
    });

    // Sottoscrizione per il filtro GPS
    this.gpsFilterService.updateGpsFilterOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedOptions: string[]) => {
        this.gps.setValue(selectedOptions);
      },
    });

    // Sottoscrizione per il filtro antenna
    this.antennaFilterService.updateAntennaOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedOptions: string[]) => {
        this.antenne.setValue(selectedOptions);
      },
    });

    // Sottoscrizione per il filtro sessione
    this.sessionFilterService.updateSessionOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedOptions: string[]) => {
        this.sessionStates.setValue(selectedOptions);
      },
    });
  }

  /**
   * Gestisce le sottoscrizioni ai click sul grafico degli errori
   */
  private handleErrorGraphClick() {
    merge(
      this.checkErrorsService.fillTable$,
      this.errorGraphService.loadFunzionanteData$,
      this.errorGraphService.loadWarningData$,
      this.errorGraphService.loadErrorData$
    )
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: () => {
        this.filtersCommonService.applyFilters$.next(this.filters);
      },
      error: (error) => {
        console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error);
      }
    });
  }

  // checkCantiereEnabled(cantiere: string): boolean{
  //   return this.cantieri.value ? this.cantieri.value.includes(cantiere) : false;
  // }


  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro dei cantieri
   * @param option opzione selezionata
   */
  selectCantiere(option: string) {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allData"));
    let selectedCantieri = this.cantieri.value || [];

    if (option === "Seleziona tutto") {
      this.toggleSelectAll();
    } else {
      //rimozione seleziona tutto in caso venga deselezionata un opzione diversa da quest'ultimo
      selectedCantieri = selectedCantieri.filter(selection => selection !== "Seleziona tutto");

      //controllo se i cantieri sono tutti selezionati
      if (this.cantieriFilterService.isCantieriAllSelected()) {
        this.cantieriFilterService.allSelected = false;
        this.cantieri.setValue(selectedCantieri);
      }

      const allOptions = this.cantiereFilterService.vehiclesCantieriOnce(allVehicles);
      const areAllSelected = allOptions.every(option => selectedCantieri.includes(option));

      //selezione di seleziona tutto in caso tutte le opzioni vengano selezionate singolarmente, non direttamente da "Seleziona tutto"
      if (areAllSelected && !selectedCantieri.includes("Seleziona tutto")) {
        selectedCantieri.unshift("Seleziona tutto");
        this.cantieri.setValue(selectedCantieri);
        this.cantieriFilterService.allSelected = true;
      }
    }
    this.filtersCommonService.applyFilters$.next(this.filters);
    this.cd.detectChanges();
  }



  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro dei gps
   * @param option opzione selezionata
   */
  selectGps(option: string) {
    const selectedGpsStates = this.gps.value || [];

    if (option === "Seleziona tutto") {
      this.toggleSelectAll();
    } else {
      //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
      if (this.gpsFilterService.isGpsFilterAllSelected()) {
        this.gpsFilterService.allSelected = false;
        this.gps.setValue(selectedGpsStates.filter(selection => selection !== "Seleziona tutto"));
      }

      const allOptions = ["Funzionante", "Warning", "Errore"];
      const areAllSelected = allOptions.every(option => selectedGpsStates.includes(option));

      //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
      if (areAllSelected && !selectedGpsStates.includes("Seleziona tutto")) {
        selectedGpsStates.push("Seleziona tutto");
        this.gps.setValue(selectedGpsStates);
        this.gpsFilterService.allSelected = true;
      }
    }

    this.filtersCommonService.applyFilters$.next(this.filters);
    this.cd.detectChanges();
  }


  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  selectAntenna(option: string) {
    const selectedAntenne = this.antenne.value || [];

    if (option === "Seleziona tutto") {
      this.toggleSelectAll();
    } else {
      //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
      if (this.antennaFilterService.isAntennaFilterAllSelected()) {
        this.antennaFilterService.allSelected = false;
        this.antenne.setValue(selectedAntenne.filter(selection => selection !== "Seleziona tutto"));
      }

      const allOptions = ["Funzionante", "Errore", "Blackbox"];
      const areAllSelected = allOptions.every(option => selectedAntenne.includes(option));

      //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
      if (areAllSelected && !selectedAntenne.includes("Seleziona tutto")) {
        selectedAntenne.push("Seleziona tutto");
        this.antenne.setValue(selectedAntenne);
        this.antennaFilterService.allSelected = true;
      }
    }

    this.filtersCommonService.applyFilters$.next(this.filters);
    this.cd.detectChanges();
  }

  selectSession(option: string) {
    const selectedSessionStates = this.sessionStates.value || [];

    if (option === "Seleziona tutto") {
      this.toggleSelectAll();
    } else {
      // Rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
      if (this.sessionFilterService.isSessionFilterAllSelected()) {
        this.sessionFilterService.allSelected = false;
        this.sessionStates.setValue(
          selectedSessionStates.filter(selection => selection !== "Seleziona tutto")
        );
      }

      const allOptions = ["Funzionante", "Errore"];
      const areAllSelected = allOptions.every(option => selectedSessionStates.includes(option));

      // Selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
      if (areAllSelected && !selectedSessionStates.includes("Seleziona tutto")) {
        selectedSessionStates.push("Seleziona tutto");
        this.sessionStates.setValue(selectedSessionStates);
        this.sessionFilterService.allSelected = true;
      }
    }

    this.filtersCommonService.applyFilters$.next(this.filters);
    this.cd.detectChanges();
  }


  toggleSelectAllSession(){
    if(this.sessionFilterService.toggleSelectAllSessionStates()){
      this.sessionStates.setValue(["Seleziona tutto", ...this.sessionFilterService.allOptions]);
    }else{
      this.sessionStates.setValue([]);
    }

  }

  /**
   * Seleziona tutti i filtri del select dei gps
   */
  toggleSelectAllGps() {
    if(this.gpsFilterService.toggleSelectAllGps()){
      this.gps.setValue(["Seleziona tutto", ...this.gpsFilterService.allOptions]);
    }else{
      this.gps.setValue([]);
    }
  }

  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  toggleSelectAllAntenne(){
    if(this.antennaFilterService.toggleSelectAllAntenne()){
      this.antenne.setValue(["Seleziona tutto", ...this.antennaFilterService.allOptions]);
    }else{
      this.antenne.setValue([]);
    }
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAll() {
    // Recupero dei dati dal sessionStorage
    const storedData = this.sessionStorageService.getItem("allData");
    if (storedData) {
      const allData: VehicleData[] = JSON.parse(storedData);

      const allVehicles = allData.map((vehicleData: any) => {
        return vehicleData.vehicle;
      });

      this.cantieri.setValue(this.cantieriFilterService.updateListaCantieri(allVehicles));
    }
    this.toggleSelectAllGps()
    this.toggleSelectAllAntenne();
    this.toggleSelectAllSession();
    this.cd.detectChanges();
    console.log("togglato tutto!");
  }

  /**
   * Controlla se tutti i cantieri sono selezionati
   * @returns ritorna il risultato della funzione nel servizio
   */
  isCantieriAllSelected(): boolean {
    return this.cantieriFilterService.isCantieriAllSelected();
  }

  /**
   * Invia il subject per filtrare le targhe in base all'input inserito
   * @param emptyButtonClick se la funzione è stata chiamata dalla premuta del bottone per svuotare il campo
   */
  searchPlates(){
    // if(!this.filters.plate){
    //   this.toggleSelectAll();
    // }

    this.filtersCommonService.applyFilters$.next(this.filters);
  }
  public get filters(): Filters {
    return this._filters;
  }
  public set filters(value: Filters) {
    this._filters = value;
  }
}
