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

  listaCantieri: string[] = [];

  allSelected: boolean = false;

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

    const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
    this.listaCantieri = this.cantiereFilterService.vehiclesCantieriOnce(allData);
    this.cd.detectChanges();

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
  selectCantiere() {
    const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
    let selectedCantieri = this.cantieri.value || [];

    const allOptions = this.cantiereFilterService.vehiclesCantieriOnce(allData);
    const areAllSelected = allOptions.every(option => selectedCantieri.includes(option));

    console.log("allOptions: ", allOptions);
    if (areAllSelected && !selectedCantieri.includes("Seleziona tutto")) {
      this.cantieri.setValue(["Seleziona tutto", ...selectedCantieri]);
      this.allSelected = true
    }else{
      this.allSelected = false;
      this.cantieri.setValue(selectedCantieri.filter(option => option != "Seleziona tutto"));
    }

    this.filtersCommonService.applyFilters$.next(this.filters);
    this.cd.detectChanges();
  }



  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro dei gps
   * @param option opzione selezionata
   */
  selectGps() {
    const selectedGpsStates = this.gps.value || [];

    //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
    if (this.allSelected) {
      this.allSelected = false;
      this.gps.setValue(selectedGpsStates.filter(selection => selection !== "Seleziona tutto"));
    }

    const allOptions = ["Funzionante", "Warning", "Errore"];
    const areAllSelected = allOptions.every(option => selectedGpsStates.includes(option));

    //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
    if (areAllSelected && !selectedGpsStates.includes("Seleziona tutto")) {
      selectedGpsStates.push("Seleziona tutto");
      this.gps.setValue(selectedGpsStates);
      this.allSelected = true;
    }

    this.filtersCommonService.applyFilters$.next(this.filters);
    this.cd.detectChanges();
  }


  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  selectAntenna() {
    const selectedAntenne = this.antenne.value || [];

    //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
    if (this.allSelected) {
      this.allSelected = false;
      this.antenne.setValue(selectedAntenne.filter(selection => selection !== "Seleziona tutto"));
    }

    const allOptions = ["Funzionante", "Errore", "Blackbox"];
    const areAllSelected = allOptions.every(option => selectedAntenne.includes(option));

    //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
    if (areAllSelected && !selectedAntenne.includes("Seleziona tutto")) {
      selectedAntenne.push("Seleziona tutto");
      this.antenne.setValue(selectedAntenne);
      this.allSelected = true;
    }

    this.filtersCommonService.applyFilters$.next(this.filters);
    this.cd.detectChanges();
  }

  selectSession() {
    const selectedSessionStates = this.sessionStates.value || [];

    // Rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
    if (this.sessionFilterService.isSessionFilterAllSelected()) {
      this.allSelected = false;
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
      this.allSelected = true;
    }

    this.filtersCommonService.applyFilters$.next(this.filters);
    this.cd.detectChanges();
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAllCantieri(){
    this.cantieri.setValue(!this.allSelected ? ["Seleziona tutto", ...this.listaCantieri] : []);
  }

  /**
   * Seleziona tutti i filtri del select delle sessioni
   */
  toggleSelectAllSession(){
    this.sessionStates.setValue(!this.allSelected ? ["Seleziona tutto", ...this.sessionFilterService.allOptions] : []);
  }

  /**
   * Seleziona tutti i filtri del select dei gps
   */
  toggleSelectAllGps() {
    this.gps.setValue(!this.allSelected ? ["Seleziona tutto", ...this.gpsFilterService.allOptions] : [])
  }

  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  toggleSelectAllAntenne(){
    this.antenne.setValue(!this.allSelected ? ["Seleziona tutto", ...this.antennaFilterService.allOptions] : []);
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAll() {
    // Recupero dei dati dal sessionStorage
    this.toggleSelectAllCantieri();
    this.toggleSelectAllGps()
    this.toggleSelectAllAntenne();
    this.toggleSelectAllSession();
    this.allSelected = !this.allSelected;
    this.cd.detectChanges();
    console.log("togglato tutto!");
    this.filtersCommonService.applyFilters$.next(this.filters);
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
