import { Component, effect, EventEmitter, inject, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
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

@Component({
  selector: 'app-veicoli-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSortModule
  ],
  templateUrl: './veicoli-table.component.html',
  styleUrl: './veicoli-table.component.css'
})
export class VeicoliTableComponent {
private readonly destroy$: Subject<void> = new Subject<void>();
  readonly dialog = inject(MatDialog);
  @ViewChild('veicoliTable', {static: false}) veicoliTable!: MatTable<Vehicle>;
  @ViewChild(MatSort) sort!: MatSort;
  snackBar= inject(MatSnackBar);
  displayedColumns: string[] = ['Targa', 'Comune', 'Societa', 'Cantiere', 'Stato', 'Azioni'];
  veicoliTableData = new MatTableDataSource<Vehicle>();
  @Input() veicoli: Vehicle[] = [];
  @Output() veicoliChange: EventEmitter<Vehicle[]> = new EventEmitter<Vehicle[]>();

  constructor(
    private gestioneSocietaService: GestioneSocietaService,
    private sortService: SortService,
    private router: Router
  ){
    // effect(() => {

    // });
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

  sortVeicoliByMatSort(veicoli: Vehicle[]): Vehicle[]{
    return this.sortService.sortVehiclesByMatSort(veicoli, this.sort) as Vehicle[];
  }

  editVeicolo(vehiVehicle: Vehicle){
  }

  /**
   * Apre la snackbar con il contenuto passato
   * @param content stringa contenuto della snackbar
   */
  openSnackbar(content: string): void {
    this.snackBar.openFromComponent(SnackbarComponent, {
      duration: 2 * 1000,
      data: { content: content }
    });
  }
}
