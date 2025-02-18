import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { Vehicle } from '../../../Models/Vehicle';
import { MatIconModule } from '@angular/material/icon';
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeApiService } from '../../../Common-services/realtime-api/realtime-api.service';
import { RealtimeData } from '../../../Models/RealtimeData';
import { MatButtonModule } from '@angular/material/button';
import { SessionApiService } from '../../../Common-services/session/session-api.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { ListaFiltersComponent } from "../lista-filters/lista-filters.component";
import { Point } from '../../../Models/Point';

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
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    ListaFiltersComponent
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

  selectedVehicle!: Vehicle;

  constructor(
    private vehiclesApiService: VehiclesApiService,
    private sessionApiService: SessionApiService,
    private realtimeApiService: RealtimeApiService,
    private filtersCommonService: FiltersCommonService,
    private sessionStrorageService: SessionStorageService,
    private router: Router,
    private mapService: MapService,
    private cd: ChangeDetectorRef
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
        this.sessionStrorageService.setItem("allVehicles", JSON.stringify(vehicles));
        if(this.vehiclesList){
          this.vehiclesList.renderRows();
        }
        this.getAllLastRealtime();
      },
      error: error => console.error("Errore nella ricezione di tutti i veicoli: ", error)
    });

    this.filtersCommonService.applyFilters$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (filters: Filters) => {
        const allVehicles = JSON.parse(this.sessionStrorageService.getItem("allVehicles"))
        this.vehiclesListData.data = this.filtersCommonService.applyAllFiltersOnVehicles(allVehicles, filters) as Vehicle[];
      },
      error: error => console.error("Errore nella ricevuta dell'applicazione dei filtri: ", error)
    });
  }

  /**
   * Recupera i dati del realtime dalla chiamata API e unisce i risultati con i veicoli della tabella
   */
  private getAllLastRealtime() {
    this.realtimeApiService.getAllLastRealtime().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (realtimeDataObj: RealtimeData[]) => {
          console.log("realtime data fetched from storico: ", realtimeDataObj);
          const tableVehicles: Vehicle[] = this.realtimeApiService.mergeVehiclesWithRealtime(this.vehiclesListData.data, realtimeDataObj) as Vehicle[];
          this.vehiclesListData.data = tableVehicles;
          if(this.vehiclesList){
            this.vehiclesList.renderRows();
          }
        },
        error: error => console.error("Errore nel caricamento dei dati realtime: ", error)
      });
  }

  setVehicleSelection(vehicle: Vehicle){
    this.selectedVehicle = vehicle;
    this.cd.detectChanges();
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
    this.mapService.initMap$.next({
      point: new Point(realtimeData.realtime.latitude, realtimeData.realtime.longitude)
    });
    this.mapService.loadPosition$.next(realtimeData);
  }

}
