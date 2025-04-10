import {
  AfterViewInit,
  Component,
  effect,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';
import { SnackbarComponent } from '../../../../Common-components/snackbar/snackbar.component';
import { SortService } from '../../../sort/sort.service';
import { Company } from '../../../../Models/Company';
import { GestioneSocietaService } from '../../Services/gestione-societa/gestione-societa.service';
import { DeleteSocietaDialogComponent } from '../delete-societa-dialog/delete-societa-dialog.component';

@Component({
  selector: 'app-societa-table',
  standalone: true,
  imports: [
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSortModule,
  ],
  templateUrl: './societa-table.component.html',
  styleUrl: './societa-table.component.css',
})
export class SocietaTableComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  readonly dialog = inject(MatDialog);
  @ViewChild('societaTable', { static: false })
  societaTable!: MatTable<Company>;
  @ViewChild(MatSort) sort!: MatSort;
  snackBar = inject(MatSnackBar);
  displayedColumns: string[] = [
    'SuId',
    'Societa',
    'Comuni associati',
    'Cantieri associati',
    'Azioni',
  ];
  societaTableData = new MatTableDataSource<Company>();
  @Input() societa: Company[] = [];
  @Output() societaChange: EventEmitter<Company[]> = new EventEmitter<
    Company[]
  >();

  constructor(
    private gestioneSocietaService: GestioneSocietaService,
    private sortService: SortService,
    private router: Router
  ) {
    effect(() => {
      const selectedSocieta =
        this.gestioneSocietaService.societaFilter() as string[];
      this.societaTableData.data = this.societa.filter((soci: Company) =>
        selectedSocieta.includes(soci.name)
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['societa']) {
      this.societaTableData.data = this.societa;
    }
  }

  ngAfterViewInit(): void {
    this.societaTableData.data = this.societa;
    this.societaTable.renderRows();
  }

  sortSocietaByMatSort(companies: Company[]): Company[] {
    return this.sortService.sortCompanyByMatSort(companies, this.sort);
  }

  editSocieta(company: Company) {}

  deleteSocieta(company: Company) {
    const companyId = company.id;

    const dialogRef = this.dialog.open(DeleteSocietaDialogComponent, {
      data: { companyName: company.name },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.gestioneSocietaService
          .deleteCompany(companyId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              if (result) {
                this.societa = this.societa.filter(
                  (societa) => societa.id != companyId
                );
                this.societaTableData.data = this.societa;
                this.societaChange.emit(this.societa);
                this.openSnackbar(`Società ${company.name} eliminata`);
              } else {
                this.openSnackbar(
                  `Eliminazione società ${company.name} annullata`
                );
              }
            },
            error: (error) => {
              console.error(
                `Errore nell'eliminazione della societaà con id ${companyId}: `,
                error
              );
              this.openSnackbar("Errore nell'eliminazione della società")
            }
          });
      });
  }

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
