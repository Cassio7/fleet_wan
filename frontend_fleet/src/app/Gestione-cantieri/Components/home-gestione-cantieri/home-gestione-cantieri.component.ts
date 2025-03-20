import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CantieriTableComponent } from "../cantieri-table/cantieri-table.component";
import { WorkSite } from '../../../Models/Worksite';
import { CantieriFiltersComponent } from "../cantieri-filters/cantieri-filters.component";
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { GestioneCantieriService } from '../../Services/gestione-cantieri/gestione-cantieri.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-home-gestione-cantieri',
  standalone: true,
  imports: [CommonModule, MatButtonModule, CantieriTableComponent, CantieriFiltersComponent],
  templateUrl: './home-gestione-cantieri.component.html',
  styleUrl: './home-gestione-cantieri.component.css'
})
export class HomeGestioneCantieriComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  cantieri!: WorkSite[];

  constructor(private gestioneCantieriService: GestioneCantieriService, private cd: ChangeDetectorRef){}

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete();
  }

  ngOnInit(): void {

    this.gestioneCantieriService.getAllWorksite().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (worksites: WorkSite[]) => {
        this.cantieri = worksites;
        console.log('cantieri fetched from home getsione: ', worksites);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nell'ottenere tutti i cantieri: ", error)
    });
  }
}
