import { SessionFilterService } from './../../../Common-services/session-filter/session-filter.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { GpsFilterService } from '../../../Common-services/gps-filter/gps-filter.service';
import { AntennaFilterService } from '../../../Common-services/antenna-filter/antenna-filter.service';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';

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

export class RowFilterComponent implements OnInit, AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  filterForm!: FormGroup;

  listaCantieri: string[] = [];

  allSelected: boolean = false;

  cantieriSelectOpened: boolean = false;
  GPSSelectOpened: boolean = false;
  antennaSelectOpened: boolean = false;
  sessionSelectOpened: boolean = false;

  private _filters: Filters = {
    plate: "",
    cantieri: new FormControl<string[]>([]),
    gps: new FormControl<string[]>([]),
    antenna: new FormControl<string[]>([]),
    sessione: new FormControl<string[]>([])
  };


  constructor(
    public filtersCommonService: FiltersCommonService,
    public cantieriFilterService: CantieriFilterService,
    public gpsFilterService: GpsFilterService,
    public antennaFilterService: AntennaFilterService,
    private kanbanTableService: KanbanTableService,
    private kanbanGpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService,
    public sessionFilterService: SessionFilterService,
    private cantiereFilterService: CantieriFilterService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef) {
    this.filterForm = new FormGroup({
      plate: new FormControl(''),
      cantieri: new FormControl<string[]>([]),
      gps:  new FormControl<string[]>([]),
      antenna: new FormControl<string[]>([]),
      sessionStates: new FormControl<string[]>([])
    });
  }
  ngOnInit(): void {
    this.filterForm.valueChanges.pipe(takeUntil(this.destroy$), skip(4))
    .subscribe({
      next: () => {
        this.setFiltersObj();
        this.kanbanTableService.filtersValue.set(this.filters);
        this.filtersCommonService.applyFilters$.next(this.filters);
        console.log('filtri impostati: ', this.filters);
      },
      error: error => console.log("Errore nell'ascolto del form dei filtri: ", error)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
      if(allData) this.listaCantieri = this.cantiereFilterService.vehiclesCantieriOnce(allData);

      this.toggleSelectAll();

      this.handleKanbanChange();

      this.handleAllFiltersOptionsUpdate();
      // this.handleErrorGraphClick();

      // Aggiornamento del change detection (solitamente solo se ci sono modifiche dirette al DOM)
      this.cd.detectChanges();
    }, 1000);
  }

  private handleKanbanChange(){
    this.kanbanTableService.loadKabanTable$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe(() => {
      this.applyToggleSelectAll();
    });
    this.kanbanGpsService.loadKanbanGps$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe(()=>{
      this.applyToggleSelectAll();
    });
    this.kanbanAntennaService.loadKanbanAntenna$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe(() => {
      this.applyToggleSelectAll();
    });
  }

  private handleAllFiltersOptionsUpdate(){
    // Sottoscrizione per il filtro cantieri
    this.cantiereFilterService.updateCantieriFilterOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedCantieri: string[]) => {
        this.filterForm.get('cantieri')?.setValue(selectedCantieri);
      },
    });

    // Sottoscrizione per il filtro GPS
    this.gpsFilterService.updateGpsFilterOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedOptions: string[]) => {
        this.filterForm.get('gps')?.setValue(selectedOptions);
      },
    });

    // Sottoscrizione per il filtro antenna
    this.antennaFilterService.updateAntennaOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedOptions: string[]) => {
        this.filterForm.get('antenna')?.setValue(selectedOptions);
      },
    });

    // Sottoscrizione per il filtro sessione
    this.sessionFilterService.updateSessionOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedOptions: string[]) => {
        this.filterForm.get('sessionStates')?.setValue(selectedOptions);
      },
    });
  }

  private setFiltersObj(){
    this.filters.plate = this.filterForm.get('plate')?.value;
    this.filters.antenna = this.filterForm.get('antenna') as FormControl<string[] | null>;
    this.filters.cantieri = this.filterForm.get('cantieri') as FormControl<string[] | null>;
    this.filters.gps = this.filterForm.get('gps') as FormControl<string[] | null>;
    this.filters.sessione = this.filterForm.get('sessionStates') as FormControl<string[] | null>;
  }

  /**
   * Gestisce le sottoscrizioni ai click sul grafico degli errori
   */
  // private handleErrorGraphClick() {
  //   merge(
  //     this.checkErrorsService.fillTable$,
  //     this.errorGraphService.loadFunzionanteData$,
  //     this.errorGraphService.loadWarningData$,
  //     this.errorGraphService.loadErrorData$
  //   )
  //   .pipe(takeUntil(this.destroy$), skip(1))
  //   .subscribe({
  //     next: () => {
  //
  //     },
  //     error: (error) => {
  //       console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error);
  //     }
  //   });
  // }

  // checkCantiereEnabled(cantiere: string): boolean{
  //   return this.cantieri.value ? this.cantieri.value.includes(cantiere) : false;
  // }


  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro dei cantieri
   * @param option opzione selezionata
   */
  selectCantiere() {
    const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
    let selectedCantieri: string[] = this.filterForm.get('cantieri')?.value || [];

    const allOptions = this.cantiereFilterService.vehiclesCantieriOnce(allData);
    const areAllSelected = allOptions.every(option => selectedCantieri.includes(option));

    console.log("allOptions: ", allOptions);
    if (areAllSelected && !selectedCantieri.includes("Seleziona tutto")) {
      this.filterForm.get('cantieri')?.setValue(["Seleziona tutto", ...selectedCantieri]);
      this.allSelected = true
    }else{
      this.allSelected = false;
      this.filterForm.get('cantieri')?.setValue(selectedCantieri.filter((option: string) => option != "Seleziona tutto"));
    }
    this.cd.detectChanges();
  }



  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro dei gps
   * @param option opzione selezionata
   */
  selectGps() {
    const selectedGpsStates: string[] = this.filterForm.get('gps')?.value || [];

    //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
    if (this.allSelected) {
      this.allSelected = false;
      this.filterForm.get('gps')?.setValue(selectedGpsStates.filter(selection => selection !== "Seleziona tutto"));
    }

    const allOptions = ["Funzionante", "Warning", "Errore"];
    const areAllSelected = allOptions.every(option => selectedGpsStates.includes(option));

    //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
    if (areAllSelected && !selectedGpsStates.includes("Seleziona tutto")) {
      selectedGpsStates.push("Seleziona tutto");
      this.filterForm.get('gps')?.setValue(selectedGpsStates);
      this.allSelected = true;
    }


    this.cd.detectChanges();
  }


  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  selectAntenna() {
    const selectedAntenne: string[] = this.filterForm.get('antenna')?.value || [];

    //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
    if (this.allSelected) {
      this.allSelected = false;
      this.filterForm.get('antenna')?.setValue(selectedAntenne.filter(selection => selection !== "Seleziona tutto"));
    }

    const allOptions = ["Funzionante", "Errore", "Blackbox"];
    const areAllSelected = allOptions.every(option => selectedAntenne.includes(option));

    //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
    if (areAllSelected && !selectedAntenne.includes("Seleziona tutto")) {
      selectedAntenne.push("Seleziona tutto");
      this.filterForm.get('antenna')?.setValue(selectedAntenne);
      this.allSelected = true;
    }


    this.cd.detectChanges();
  }

  selectSession() {
    const selectedSessionStates: string[] = this.filterForm.get('sessionStates')?.value || [];

    //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
    if (this.allSelected) {
      this.allSelected = false;
      this.filterForm.get('sessionStates')?.setValue(selectedSessionStates.filter(selection => selection !== "Seleziona tutto"));
    }

    // Rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
    if (this.allSelected) {
      this.allSelected = false;
      this.filterForm.get('sessionStates')?.setValue(
        selectedSessionStates.filter(selection => selection !== "Seleziona tutto")
      );
    }

    const allOptions = ["Funzionante", "Errore"];
    const areAllSelected = allOptions.every(option => selectedSessionStates.includes(option));

    //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
    if (areAllSelected && !selectedSessionStates.includes("Seleziona tutto")) {
      selectedSessionStates.push("Seleziona tutto");
      this.filterForm.get('sessionStates')?.setValue(selectedSessionStates);
      this.allSelected = true;
    }
    this.cd.detectChanges();
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAllCantieri(){
    this.filterForm.get('cantieri')?.setValue(!this.allSelected ? ["Seleziona tutto", ...this.listaCantieri] : []);
  }

  /**
   * Seleziona tutti i filtri del select delle sessioni
   */
  toggleSelectAllSession(){
    this.filterForm.get('sessionStates')?.setValue(!this.allSelected ? ["Seleziona tutto", ...this.sessionFilterService.allOptions] : []);
  }

  /**
   * Seleziona tutti i filtri del select dei gps
   */
  toggleSelectAllGps() {
    this.filterForm.get('gps')?.setValue(!this.allSelected ? ["Seleziona tutto", ...this.gpsFilterService.allOptions] : [])
  }

  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  toggleSelectAllAntenne(){
    this.filterForm.get('antenna')?.setValue(!this.allSelected ? ["Seleziona tutto", ...this.antennaFilterService.allOptions] : []);
  }

  /**
   * Seleziona tutte le opzioni di tutti i filtri e manda il subject per
   * applicarli sui veicoli della tabella
   */
  applyToggleSelectAll() {
    this.toggleSelectAll()
  }
  /**
   * Seleziona tutte le opzioni di tutti i filtri
   */
  toggleSelectAll(){
    this.toggleSelectAllCantieri();
    this.toggleSelectAllGps()
    this.toggleSelectAllAntenne();
    this.toggleSelectAllSession();
    this.allSelected = !this.allSelected;
    this.cd.detectChanges();
  }


  /**
   * Invia il subject per filtrare le targhe in base all'input inserito
   * @param emptyButtonClick se la funzione è stata chiamata dalla premuta del bottone per svuotare il campo
   */
  searchPlates(){
    // if(!this.filters.plate){
    //   this.toggleSelectAll();
    // }
  }
  public get filters(): Filters {
    return this._filters;
  }
  public set filters(value: Filters) {
    this._filters = value;
  }
}
