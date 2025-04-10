import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { CommonService } from '../../../Common-services/common service/common.service';
import { GestioneSocietaService } from '../../../Common-services/Gestione-Società/Services/gestione-societa/gestione-societa.service';
import { Company } from '../../../Models/Company';
import { Group } from '../../../Models/Group';
import { SocietaTableComponent } from "../../../Common-services/Gestione-Società/Components/societa-table/societa-table.component";
import { SocietaFiltersComponent } from "../../../Common-services/Gestione-Società/Components/societa-filters/societa-filters.component";
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
    private commonService: CommonService,
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
