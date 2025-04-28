import { CommonModule } from '@angular/common';
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
import { FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import {
  Filters,
  FiltersCommonService,
} from '../../../Common-services/filters-common/filters-common.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { SvgService } from '../../../Common-services/svg/svg.service';
import { Vehicle } from '../../../Models/Vehicle';
import {
  GestioneVeicoliService,
} from '../../Services/gestione-veicoli.service';

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
    'Cantiere',
    'Comune',
    'Societa',
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
      if (currentFilters && this.veicoli) {
        const { targa, cantieri, societa } = currentFilters;
        this.filters.plate = targa;
        this.filters.cantieri.setValue(cantieri);
        this.filters.societa.setValue(societa);

        this.veicoliTableData.data =
          this.filtersCommonService.applyAllFiltersOnVehicles(
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

  editVeicolo(vehicle: Vehicle) {
    this.router.navigate(['/gestione-veicolo', vehicle.veId]);
  }
}
