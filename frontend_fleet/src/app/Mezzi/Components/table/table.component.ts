import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { catchError, EMPTY, skip, Subject, takeUntil, tap } from 'rxjs';
import { NoteSectionComponent } from '../../../Common-components/note-section/note-section.component';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import {
  Filters,
  FiltersCommonService,
} from '../../../Common-services/filters-common/filters-common.service';
import { FirstEventsFilterService } from '../../../Common-services/firstEvents-filter/first-events-filter.service';
import { ModelFilterService } from '../../../Common-services/model-filter/model-filter.service';
import { NotesService } from '../../../Common-services/notes/notes.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { SvgService } from '../../../Common-services/svg/svg.service';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { Note } from '../../../Models/Note';
import { Session } from '../../../Models/Session';
import { Vehicle } from '../../../Models/Vehicle';
import { MezziFiltersService } from '../../Services/mezzi-filters/mezzi-filters.service';
import { SelectService } from '../../Services/select/select.service';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MatProgressBarModule,
    MatInputModule,
    MatCheckboxModule,
    MatTableModule,
    MatTooltipModule,
    MatSortModule,
    NoteSectionComponent,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class TableComponent
  implements AfterViewInit, AfterViewChecked, OnDestroy
{
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;
  private readonly destroy$: Subject<void> = new Subject<void>();
  readonly panelOpenState = signal(false);
  resetLoading = false;
  loadingProgress: number = 0;
  loadingText: string = '';

  vehicleTableData = new MatTableDataSource<Vehicle>();

  sortedVehicles: Vehicle[] = [];
  expandedVehicle: Vehicle | null = null;

  displayedColumns: string[] = [
    'Proprietario',
    'Targa',
    'Immatricolazione',
    'Marca',
    'Tipologia',
    'Cantiere',
    'Allestimento',
    'Installazione fleet',
  ];
  columnsToDisplayWithExpand = [...this.displayedColumns, 'expand'];

  constructor(
    public selectService: SelectService,
    public svgService: SvgService,
    private cantieriFilterService: CantieriFilterService,
    private firstEventsFilterService: FirstEventsFilterService,
    private modelFilterService: ModelFilterService,
    private sortService: SortService,
    private notesService: NotesService,
    private authService: AuthService,
    private vehicleApiService: VehiclesApiService,
    private sessionStorageService: SessionStorageService,
    private mezziFilterService: MezziFiltersService,
    private filtersCommonService: FiltersCommonService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewChecked(): void {
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    //ascolto sui reset dei filtri della tabella
    this.mezziFilterService.filterTable$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (vehicles: Vehicle[]) => {
          this.vehicleTableData.data = [];

          if (vehicles && vehicles.length > 0) {
            this.vehicleTableData.data = vehicles;
          }

          this.vehicleTable.renderRows();
        },
        error: (error) =>
          console.error('Errore nel filtro della tabella: ', error),
      });

    //ascolto sui filtri della tabella
    this.filtersCommonService.applyFilters$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (filters: Filters) => {
          const allVehicles = JSON.parse(
            this.sessionStorageService.getItem('allVehicles')
          );
          this.vehicleTableData.data =
            this.filtersCommonService.applyAllFiltersOnVehicles(
              allVehicles,
              filters
            ) as Vehicle[];
        },
        error: (error) =>
          console.error(
            'Errore nella ricezione della notifica per applicare tutti i filtri: ',
            error
          ),
      });

    //riempimento dei dati della tabella
    this.fillTable();
    this.cd.detectChanges();
  }

  /**
   * Esegue il riempimento della tabella
   */
  fillTable(): void {
    this.loadVehicles();
  }

  /**
   * Ricerca tutti i veicoli
   * facendo una chiamata API
   */
  loadVehicles(): void {
    const vehicles$ = this.vehicleApiService.getAllVehicles().pipe(
      tap(() => {
        this.loadingText = 'Caricamento dei veicoli...';
        this.loadingProgress += 50;
      }),
      catchError((error) => {
        console.error('Error fetching vehicles: ', error);
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    );

    vehicles$.subscribe((vehicles) => {
      this.sessionStorageService.setItem(
        'allVehicles',
        JSON.stringify(vehicles)
      );
      this.sortedVehicles = this.sortService.sortVehiclesByPlateAsc(
        vehicles
      ) as Vehicle[];
      this.vehicleTableData.data = this.sortedVehicles;
      this.vehicleTable.renderRows();
      this.selectService.selectVehicles(this.sortedVehicles);
      this.loadNotes();
      this.cd.detectChanges();
    });
  }

  /**
   * Ricerca la nota associata a ciuscun veicolo
   * facendo una chiamata API
   */
  loadNotes(): void {
    const notes$ = this.notesService.getAllNotes().pipe(
      tap(() => {
        this.loadingText = 'Caricamento delle note...';
        this.loadingProgress += 50;
      }),
      catchError((error) => {
        console.error('Error fetching notes: ', error);
        return EMPTY;
      }),
      takeUntil(this.destroy$)
    );

    notes$.subscribe((notes) => {
      if (this.sortedVehicles) {
        this.sortedVehicles = this.notesService.mergeVehiclesWithNotes(
          this.sortedVehicles,
          notes
        );
        this.sessionStorageService.setItem(
          'allVehicles',
          JSON.stringify(this.sortedVehicles)
        );
        this.vehicleTableData.data = this.sortedVehicles;
        this.vehicleTable.renderRows();
        this.selectService.selectVehicles(this.sortedVehicles);
        this.cd.detectChanges();
      }
    });
  }

  sortVehiclesByMatSort(vehicles: Vehicle[]): Vehicle[] {
    const column = this.sort.active;
    const sortDirection = this.sort.direction;
    const isAsc = sortDirection === 'asc';

    const sortedVehicles = vehicles.sort((a: Vehicle, b: Vehicle) => {
      switch (column) {
        case 'Proprietario':
          const proprietarioA = a.rental?.name || a?.company?.name || '';
          const proprietarioB = b.rental?.name || b.company?.name || '';
          return this.sortService.compare(proprietarioA, proprietarioB, isAsc);
        case 'Targa':
          return this.sortService.compare(a.plate || '', b.plate || '', isAsc);
        case 'Immatricolazione':
          return this.sortService.compare(
            a.registration || '',
            b.registration || '',
            isAsc
          );
        case 'Marca':
          return this.sortService.compare(a.model || '', b.model || '', isAsc);
        case 'Tipologia':
          return this.sortService.compare(
            a.equipment?.name || '',
            b.equipment?.name || '',
            isAsc
          );
        case 'Cantiere':
          return this.sortService.compare(
            a.worksite?.name || '',
            b.worksite?.name || '',
            isAsc
          );
        case 'Installazione fleet':
          return this.sortService.compare(
            new Date(a?.fleet_install || ''),
            new Date(b?.fleet_install || ''),
            isAsc
          );
        default:
          return 0;
      }
    });

    return sortedVehicles;
  }

  /**
   * Controlla l'espansione e la contrazione della sezione commenti di un veicolo.
   * @param vehicle veicolo di cui espandere la riga.
   * @returns Il veicolo attualmente espanso, oppure null se nessun veicolo è espanso.
   */
  checkVehicleExpansion(vehicle: Vehicle) {
    this.notesService.loadNote$.next();
    return (this.expandedVehicle =
      this.expandedVehicle === vehicle ? null : vehicle);
  }

  /**
   * Viene chiamata quando si preme sul checkbox "Seleziona tutto" di una qualsiasi colonna
   * @param column colonna a cui appartiene il menu dove si trova il checkbox
   * @param $event evento
   */
  selectDeselectAll($event: any) {
    this.vehicleTableData.data = this.selectService.selectDeselectAll(
      this.sortedVehicles,
      $event
    );
    this.vehicleTable.renderRows();
  }

  /**
   * Naviga alla pagina di dettaglio del veicolo
   * @param vehicleId id del veicolo del quale visualizzare il dettaglio
   */
  displayVehicleDetail(vehicleId: number) {
    this.router.navigate(['/dettaglio-mezzo', vehicleId]);
  }

  /**
   * Resetta tutte le selezioni
   */
  resetSelections() {
    //2 seconds progress bar loading
    this.resetLoading = true;
    this.vehicleTableData.data = [];
    this.cd.detectChanges();
    this.vehicleTable.renderRows();
    setTimeout(() => {
      //recupero di tutte le note dal db
      this.notesService
        .getAllNotes()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (notes: Note[]) => {
            const allVehicles: Vehicle[] = JSON.parse(
              this.sessionStorageService.getItem('allVehicles')
            );
            const mergedVehicles: Vehicle[] =
              this.notesService.mergeVehiclesWithNotes(allVehicles, notes);
            this.vehicleTableData.data = mergedVehicles;
            this.selectService.allOptionsSelected = true;
            this.resetLoading = false;
            this.cd.detectChanges();
          },
          error: (error) =>
            console.error(
              'Errore nel recupero delle note per il reset dei filtri: ',
              error
            ),
        });
    }, 1000);
  }
}
