import { AfterViewInit, Component, effect, EventEmitter, inject, Input, input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { WorkSite } from '../../../Models/Worksite';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SortService } from '../../../Common-services/sort/sort.service';
import { GestioneService, GestioneFilters } from '../../../Gestione-utenti/Services/gestione/gestione.service';
import { User } from '../../../Models/User';
import { GestioneCantieriService } from '../../Services/gestione-cantieri/gestione-cantieri.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';

@Component({
  selector: 'app-cantieri-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatMenuModule,
  ],
  templateUrl: './cantieri-table.component.html',
  styleUrl: './cantieri-table.component.css'
})
export class CantieriTableComponent implements AfterViewInit, OnChanges{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('utentiTable', {static: false}) cantieriTable!: MatTable<WorkSite>;
  @ViewChild(MatSort) sort!: MatSort;
  snackBar= inject(MatSnackBar);
  displayedColumns: string[] = ['Id', 'Cantiere', 'Comune', 'Societa', 'Veicoli associati', 'Azioni'];
  cantieriTableData = new MatTableDataSource<WorkSite>();
  @Input() cantieri!: WorkSite[];
  @Output() cantieriChange: EventEmitter<WorkSite[]> = new EventEmitter<WorkSite[]>();

  constructor(
    private gestioneCantieriService: GestioneCantieriService,
    private sortService: SortService,
    private router: Router
  ){
    effect(() => {
      const selectedCantieri = this.gestioneCantieriService.cantieriFilter() as string[];
      this.cantieriTableData.data = this.cantieri.filter((cantiere: WorkSite) => selectedCantieri.includes(cantiere.name));
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cantieri']) {
      this.cantieriTableData.data = this.cantieri;
    }
  }


  ngAfterViewInit(): void {
    this.cantieriTableData.data = this.cantieri;
    this.cantieriTable.renderRows();
  }

  /**
   * @param canteri canteri da ordinare
   * @returns Richiama la funzione nel servizio per ordinare i canteri
   */
  sortCantieriByMatSort(canteri: WorkSite[]): WorkSite[]{
    return canteri;
    // return this.sortService.sortUsersByMatSort(users, this.sort);
  }

  editCantiere(cantiere: WorkSite){

  }

  // disabilitateCantiere(cantiere: WorkSite){

  // }

  deleteCantiere(cantiere: WorkSite){
    const worksiteId = cantiere.id;
    this.gestioneCantieriService.deleteWorksiteById(worksiteId).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.cantieri = this.cantieri.filter(cantiere => cantiere.id != worksiteId);
        this.cantieriTableData.data = this.cantieri;
        this.cantieriChange.emit(this.cantieri);
        this.openSnackbar(`cantiere ${cantiere.name} eliminato`)
      },
      error: error => console.error("Errore nella cancellazione del cantiere: ", error)
    });
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
