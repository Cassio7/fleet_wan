import { AfterViewInit, Component, EventEmitter, OnDestroy, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { VehiclesApiService } from '../../Common-services/vehicles api service/vehicles-api.service';
import { Vehicle } from '../../Models/Vehicle';
import { MatIconModule } from '@angular/material/icon';
import { MapService } from '../../Common-services/map/map.service';
import { RealtimeApiService } from '../../Common-services/realtime-api/realtime-api.service';
import { RealtimeData } from '../../Models/RealtimeData';
import { MatButtonModule } from '@angular/material/button';
import { SessionApiService } from '../../Common-services/session/session-api.service';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';
import { Router } from '@angular/router';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}

@Component({
  selector: 'app-lista-mezzi',
  standalone: true,
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
],
  templateUrl: './lista-mezzi.component.html',
  styleUrl: './lista-mezzi.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ListaMezziComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('tableList') vehiclesList!: MatTable<Vehicle>;
  @Output() selectVehicle = new EventEmitter<Vehicle>();

  displayedColumns: string[] = ['icon', 'Targa', 'Cantiere', 'map'];
  vehiclesListData = new MatTableDataSource<Vehicle>();

  constructor(
    private vehiclesApiService: VehiclesApiService,
    private sessionApiService: SessionApiService,
    private realtimeApiService: RealtimeApiService,
    private router: Router,
    private mapService: MapService
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.vehiclesApiService.getAllVehicles().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        this.vehiclesListData.data = vehicles;
        if(this.vehiclesList){
          this.vehiclesList.renderRows();
        }
        this.getLastRealtime();
      },
      error: error => console.error("Errore nella ricezione di tutti i veicoli: ", error)
    });

    this.sessionApiService.loadAnomalySessionDays$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {

      },
      error: error => console.error("Errore nel caricamento delle giornate con le anomalie: ", error)
    });
  }

  /**
   * Recupera i dati del realtime dalla chiamata API e unisce i risultati con i veicoli della tabella
   */
  private getLastRealtime() {
    this.realtimeApiService.getLastRealtime().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (realtimeDataObj: RealtimeData[]) => {
          const tableVehicles: Vehicle[] = this.realtimeApiService.mergeVehiclesWithRealtime(this.vehiclesListData.data, realtimeDataObj) as Vehicle[];
          console.log("vehicle w realtimes merged: ", tableVehicles);
          this.vehiclesListData.data = tableVehicles;
          if(this.vehiclesList){
            this.vehiclesList.renderRows();
          }
        },
        error: error => console.error("Errore nel caricamento dei dati realtime: ", error)
      });
  }

  setVehicleSelection(vehicle: Vehicle){
    this.selectVehicle.emit(vehicle);
  }

  showDetail(veId: number){
    this.router.navigate(['/dettaglio-mezzo', veId]);
  }

  showMap(vehicle: Vehicle){
    const realtimeData = {
      vehicle: {
        plate: vehicle.plate,
        veId: vehicle.veId
      },
      realtime: vehicle.realtime
    }
    this.mapService.loadMap$.next(realtimeData);
  }
}
