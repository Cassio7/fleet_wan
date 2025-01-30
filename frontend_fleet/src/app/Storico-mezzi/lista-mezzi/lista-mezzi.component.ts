import { AfterViewInit, Component, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
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
    MatIconModule
],
  templateUrl: './lista-mezzi.component.html',
  styleUrl: './lista-mezzi.component.css',
  encapsulation: ViewEncapsulation.None
})
export class ListaMezziComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('tableList') vehiclesList!: MatTable<Vehicle>;

  displayedColumns: string[] = ['icon', 'Targa', 'Cantiere'];
  vehiclesListData = new MatTableDataSource<Vehicle>();

  constructor(
    private vehiclesApiService: VehiclesApiService,
    private realtimeApiService: RealtimeApiService,
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

  showMap(vehicle: Vehicle){
    console.log("realtime vehicle fetched: ", vehicle.realtime);
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
