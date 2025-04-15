import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { Vehicle } from '../../../Models/Vehicle';
import { VeicoliTableComponent } from "../veicoli-table/veicoli-table.component";
import { VeicoliFiltersComponent } from "../veicoli-filters/veicoli-filters.component";

@Component({
  selector: 'app-home-gestione-veicoli',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    VeicoliTableComponent,
    VeicoliFiltersComponent
],
  templateUrl: './home-gestione-veicoli.component.html',
  styleUrl: './home-gestione-veicoli.component.css'
})
export class HomeGestioneVeicoliComponent implements OnInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  veicoli: Vehicle[] = [];
  snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);

  constructor(
    private vehiclesApiService: VehiclesApiService,
    private cd: ChangeDetectorRef){}

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.vehiclesApiService.getAllVehiclesAdmin().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        this.veicoli = vehicles;
        console.log('vehicles fetched from home getsione: ', vehicles);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nell'ottenere tutti i societa: ", error)
    });
  }
}
