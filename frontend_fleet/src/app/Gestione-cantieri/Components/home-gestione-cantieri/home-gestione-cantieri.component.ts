import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { GestioneCantieriService } from '../../../Common-services/gestione-cantieri/gestione-cantieri.service';
import { Group } from '../../../Models/Group';
import { openSnackbar } from '../../../Utils/snackbar';
import { CantieriCreateDialogComponent } from '../cantieri-create-dialog/cantieri-create-dialog.component';
import { CantieriFiltersComponent } from '../cantieri-filters/cantieri-filters.component';
import { CantieriTableComponent } from '../cantieri-table/cantieri-table.component';
import { WorkSite } from './../../../Models/Worksite';

@Component({
  selector: 'app-home-gestione-cantieri',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarModule,
    CantieriTableComponent,
    CantieriFiltersComponent,
    MatIconModule,
  ],
  templateUrl: './home-gestione-cantieri.component.html',
  styleUrl: './home-gestione-cantieri.component.css',
})
export class HomeGestioneCantieriComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  cantieri: WorkSite[] = [];
  groups: Group[] = [];
  snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);

  constructor(
    private gestioneCantieriService: GestioneCantieriService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.gestioneCantieriService
      .getAllWorksite()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (worksites: WorkSite[]) => {
          this.cantieri = worksites;
          this.cd.detectChanges();
        },
        error: (error) =>
          console.error("Errore nell'ottenere tutti i cantieri: ", error),
      });

    this.gestioneCantieriService
      .getAllGroups()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (groups: Group[]) => {
          this.groups = groups;
          this.cd.detectChanges();
        },
        error: (error) =>
          console.error("Errore nell'ottenere tutti i cantieri: ", error),
      });
  }

  createNewCantiere(): void {
    const dialogRef = this.dialog.open(CantieriCreateDialogComponent, {
      data: {
        groups: this.groups,
        cantieri: this.cantieri,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: { name: string; comune: string }) => {
        if (result) {
          if (result.comune) {
            this.gestioneCantieriService
              .getGroupIdByName(result.comune)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (gruopId: number | null) => {
                  if (gruopId) {
                    this.createCantiere({
                      name: result.name,
                      groupId: gruopId,
                    });
                  }
                },
                error: (error) =>
                  console.error(
                    "Errore nella ricerca dell'id del comune tramite il nome: ",
                    error
                  ),
              });
          } else {
            this.createCantiere({ name: result.name });
          }
        }
      });
  }

  private createCantiere(newWorksiteData: { name: string; groupId?: number }) {
    this.gestioneCantieriService
      .createCantiere(newWorksiteData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (createdWorksiteData: {
          message: string;
          worksite: WorkSite;
        }) => {
          openSnackbar(
            this.snackBar,
            `Nuovo cantiere ${createdWorksiteData.worksite.name} creato`
          );
          this.cantieri = [...this.cantieri, createdWorksiteData.worksite];
          this.cd.detectChanges();
        },
        error: (error) =>
          console.error('Errore nella creazione del nuovo cantiere: ', error),
      });
  }
}
