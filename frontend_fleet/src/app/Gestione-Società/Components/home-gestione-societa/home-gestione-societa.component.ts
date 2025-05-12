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
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { Company } from '../../../Models/Company';
import { Group } from '../../../Models/Group';
import { openSnackbar } from '../../../Utils/snackbar';
import { GestioneSocietaService } from '../../Services/gestione-societa/gestione-societa.service';
import { SocietaCreateDialogComponent } from '../societa-create-dialog/societa-create-dialog/societa-create-dialog.component';
import { SocietaFiltersComponent } from '../societa-filters/societa-filters.component';
import { SocietaTableComponent } from '../societa-table/societa-table.component';

@Component({
  selector: 'app-home-gestione-societa',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    SocietaTableComponent,
    SocietaFiltersComponent,
    MatIconModule,
  ],
  templateUrl: './home-gestione-societa.component.html',
  styleUrl: './home-gestione-societa.component.css',
})
export class HomeGestioneSocietaComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  societa: Company[] = [];
  groups: Group[] = [];
  snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);

  constructor(
    private gestioneSocietaService: GestioneSocietaService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.gestioneSocietaService
      .getAllSocieta()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (companies: Company[]) => {
          this.societa = companies;
          this.cd.detectChanges();
        },
        error: (error) =>
          console.error("Errore nell'ottenere tutti i societa: ", error),
      });
  }

  createNewCompany(): void {
    const dialogRef = this.dialog.open(SocietaCreateDialogComponent, {});

    dialogRef.afterClosed().subscribe((result: {suId: number, name: string}) => {
      if (result) {
        this.createCompany(result.suId, result.name);
      }
    });
  }

  private createCompany(suId: number, name: string){
    this.gestioneSocietaService.createCompany(suId, name).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: {message: string, company: Company}) => {
        this.societa = [...this.societa, response.company]
        openSnackbar(this.snackBar, `Società ${name} con suId ${suId} creata.`);
        this.cd.detectChanges();
      },
      error: error => {
        console.error("Errore nella creazione della società: ", error);
        openSnackbar(this.snackBar, "Errore nella creazione della società");
      }
    });
  }
}
