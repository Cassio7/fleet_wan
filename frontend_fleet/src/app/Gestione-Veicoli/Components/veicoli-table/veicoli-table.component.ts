import {
  Component,
  effect,
  EventEmitter,
  inject,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';
import { SortService } from '../../../Common-services/sort/sort.service';
import { DeleteSocietaDialogComponent } from '../../../Gestione-Società/Components/delete-societa-dialog/delete-societa-dialog.component';
import { GestioneSocietaService } from '../../../Gestione-Società/Services/gestione-societa/gestione-societa.service';
import { Vehicle } from '../../../Models/Vehicle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import {
  gestioneVeicoliFilters,
  GestioneVeicoliService,
} from '../../Services/gestione-veicoli.service';
import {
  Filters,
  FiltersCommonService,
} from '../../../Common-services/filters-common/filters-common.service';
import { FormControl } from '@angular/forms';
import { SvgService } from '../../../Common-services/svg/svg.service';

@Component({
  selector: 'app-veicoli-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSortModule,
  ],
  templateUrl: './veicoli-table.component.html',
  styleUrl: './veicoli-table.component.css',
})
export class VeicoliTableComponent {
  private readonly destroy$: Subject<void> = new Subject<void>();
  readonly dialog = inject(MatDialog);
  @ViewChild('veicoliTable', { static: false })
  veicoliTable!: MatTable<Vehicle>;
  @ViewChild(MatSort) sort!: MatSort;
  snackBar = inject(MatSnackBar);
  displayedColumns: string[] = [
    'Targa',
    'VeId',
    'Comune',
    'Societa',
    'Cantiere',
    'Stato',
    'Azioni',
  ];
  veicoliTableData = new MatTableDataSource<Vehicle>();
  @Input() veicoli: Vehicle[] = [];
  @Output() veicoliChange: EventEmitter<Vehicle[]> = new EventEmitter<
    Vehicle[]
  >();

  private filters: Filters = {
    plate: '',
    cantieri: new FormControl<string[] | null>(null),
    gps: new FormControl<string[] | null>(null),
    antenna: new FormControl<string[] | null>(null),
    sessione: new FormControl<string[] | null>(null),
    societa: new FormControl<string[] | null>(null),
  };

  constructor(
    public svgService: SvgService,
    private gestioneVeicoliService: GestioneVeicoliService,
    private filtersCommonService: FiltersCommonService,
    private sortService: SortService,
    private router: Router
  ) {
    effect(() => {
      const currentFilters = gestioneVeicoliService.gestioneVeicoliFilters();
      if (currentFilters) {
        const { targa, cantieri, societa } = currentFilters;
        this.filters.plate = targa;
        this.filters.cantieri.setValue(cantieri);
        this.filters.societa.setValue(societa);

        this.veicoliTableData.data =
          filtersCommonService.applyAllFiltersOnVehicles(
            this.veicoli,
            this.filters
          ) as Vehicle[];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['veicoli']) {
      this.veicoliTableData.data = this.veicoli;
    }
  }

  ngAfterViewInit(): void {
    this.veicoliTableData.data = this.veicoli;
    this.veicoliTable.renderRows();
  }

  sortVeicoliByMatSort(veicoli: Vehicle[]): Vehicle[] {
    return this.sortService.sortVehiclesByMatSort(
      veicoli,
      this.sort
    ) as Vehicle[];
  }

  editVeicolo(vehicle: Vehicle) {}

  /**
   * Apre la snackbar con il contenuto passato
   * @param content stringa contenuto della snackbar
   */
  openSnackbar(content: string): void {
    this.snackBar.openFromComponent(SnackbarComponent, {
      duration: 2 * 1000,
      data: { content: content },
    });
  }
}
