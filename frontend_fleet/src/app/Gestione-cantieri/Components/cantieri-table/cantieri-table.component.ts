import { AfterViewInit, Component, effect, EventEmitter, inject, Input, model, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { GestioneCantieriService } from '../../../Common-services/gestione-cantieri/gestione-cantieri.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { WorkSite } from '../../../Models/Worksite';
import { openSnackbar } from '../../../Utils/snackbar';
import { DeleteCantiereDialogComponent } from '../delete-cantiere-dialog/delete-cantiere-dialog.component';

@Component({
  selector: 'app-cantieri-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    MatMenuModule,
    MatSortModule
  ],
  templateUrl: './cantieri-table.component.html',
  styleUrl: './cantieri-table.component.css'
})
export class CantieriTableComponent implements AfterViewInit, OnDestroy, OnChanges{
  private readonly destroy$: Subject<void> = new Subject<void>();
  readonly dialog = inject(MatDialog);
  @ViewChild('utentiTable', {static: false}) cantieriTable!: MatTable<WorkSite>;
  @ViewChild(MatSort) sort!: MatSort;
  snackBar= inject(MatSnackBar);
  displayedColumns: string[] = ['Cantiere', 'Comune', 'Societa', 'Veicoli associati', 'Azioni'];
  cantieriTableData = new MatTableDataSource<WorkSite>();
  cantieri = model<WorkSite[]>([]);

  constructor(
    private gestioneCantieriService: GestioneCantieriService,
    private sortService: SortService,
    private router: Router
  ){
    effect(() => {
      const selectedCantieri = this.gestioneCantieriService.cantieriFilter() as string[];
      this.cantieriTableData.data = this.cantieri().filter((cantiere: WorkSite) => selectedCantieri.includes(cantiere.name));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cantieri']) {
      this.cantieriTableData.data = this.cantieri();
    }
  }


  ngAfterViewInit(): void {
    this.cantieriTableData.data = this.cantieri();
    this.cantieriTable.renderRows();
  }

  /**
   * @param canteri canteri da ordinare
   * @returns Richiama la funzione nel servizio per ordinare i canteri
   */
  sortCantieriByMatSort(canteri: WorkSite[]): WorkSite[]{
    return this.sortService.sortWorksiteByMatSort(canteri, this.sort);
  }

  editCantiere(cantiere: WorkSite){
    this.router.navigate(['/cantiere', cantiere.id]);
  }

  deleteCantiere(cantiere: WorkSite){
    const dialogRef = this.dialog.open(DeleteCantiereDialogComponent, {
      data: {worksiteName: cantiere.name}
    });

    dialogRef.afterClosed()
    .pipe(takeUntil(this.destroy$))
    .subscribe(result => {
      if(result){
        const worksiteId = cantiere.id;
        this.gestioneCantieriService.deleteWorksiteById(worksiteId).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.cantieri.set(this.cantieri().filter(cantiere => cantiere.id != worksiteId));
            this.cantieriTableData.data = this.cantieri();
            openSnackbar(this.snackBar, `cantiere ${cantiere.name} eliminato`)
          },
          error: error => console.error("Errore nella cancellazione del cantiere: ", error)
        });
      }else{
        openSnackbar(this.snackBar, "Annullata eliminazione del cantiere");
      }
    });
  }
}
