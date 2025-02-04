import { KanbanGpsService } from './../../Services/kanban-gps/kanban-gps.service';
import { GpsGraphService } from './../../Services/gps-graph/gps-graph.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { VehicleData } from '../../../Models/VehicleData';
import { AntennaGraphService } from '../../Services/antenna-graph/antenna-graph.service';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { takeUntil, skip, Subject, merge, map } from 'rxjs';
import { GpsFilterService } from '../../../Common-services/gps-filter/gps-filter.service';
import { MatOptionModule } from '@angular/material/core';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';
import { KanbanSessioneService } from '../../Services/kanban-sessione/kanban-sessione.service';

@Component({
  selector: 'app-kanban-filters',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    CommonModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    MatOptionModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './kanban-filters.component.html',
  styleUrl: './kanban-filters.component.css'
})
export class KanbanFiltersComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  filterForm!: FormGroup;
  cantieri = new FormControl<string[]>([]);
  allSelected: boolean = false;
  private _filters: Filters = {
    plate: "",
    cantieri: this.cantieri,
    gps: new FormControl(null),
    antenna: new FormControl(null),
    sessione: new FormControl(null),
  };

  kanbanCantieri: string[] = [];

  constructor(
    public cantieriFilterService: CantieriFilterService,
    private filtersCommonService: FiltersCommonService,
    private kanbanGpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService,
    private kanbanSessioneService: KanbanSessioneService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){
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
    this.kanbanCantieri = this.cantieriFilterService.vehiclesCantieriOnce(allData).sort();
    setTimeout(() => {
      this.allSelected = !this.allSelected;
      this.toggleSelectAllCantieri(this.allSelected);
      console.log("cantieri value after toggle: ", this.cantieri.value);
    });

    // Sottoscrizione per il filtro cantieri
    this.cantieriFilterService.updateCantieriFilterOptions$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedCantieri: string[]) => {
        this.cantieri.setValue(["Seleziona tutto", ...selectedCantieri]);
      },
      error: error => console.error("Errore nell'aggiornamento delle opzioni del filtro dei cantieri: ", error)
    });

    merge(
      this.kanbanAntennaService.loadKanbanAntenna$,
      this.kanbanGpsService.loadKanbanGps$,
      this.kanbanSessioneService.loadKanbanSessione$
    ).pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: () => {
        const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
        const allCantieri = this.cantieriFilterService.vehiclesCantieriOnce(allData);

        this.kanbanCantieri = allCantieri;
        console.log("setting value of cantieri");
        this.cantieri.setValue(["Seleziona tutto", ...this.kanbanCantieri]);
      },
      error: error => console.error("Errore nel caricamento del kanban: ", error)
    });

    this.allSelected = true;

    this.cd.detectChanges();
  }

  /**
   * Invia il subject per filtrare le targhe in base all'input inserito
   * @param emptyButtonClick se la funzione è stata chiamata dalla premuta del bottone per svuotare il campo
   */
  searchPlates(){
    this.filtersCommonService.applyFilters$.next(this.filters);
  }

  /**
   * Gestisce la selezione di un cantiere nel menù apposito
   * @param option opzione selezionata
   */
  selectCantiere() {
    this.filtersCommonService.applyFilters$.next(this.filters);
  }

  selectAll(){
    this.toggleSelectAllCantieri(this.allSelected);
    this.allSelected = !this.allSelected;
    this.filtersCommonService.applyFilters$.next(this.filters);
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAllCantieri(allSelected: boolean) {
    this.cantieri.setValue(["Seleziona tutto", ...this.cantieriFilterService.toggleSelectAllCantieri(allSelected)]);
  }

  public get filters(): Filters {
    return this._filters;
  }
  public set filters(value: Filters) {
    this._filters = value;
  }
}
