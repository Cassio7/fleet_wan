import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KanbanFiltersComponent } from '../kanban-filters/kanban-filters.component';
import { KanbanSessioneService } from '../../Services/kanban-sessione/kanban-sessione.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { VehicleData } from '../../../Models/VehicleData';
import { takeUntil, skip, Subject } from 'rxjs';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeApiService } from '../../../Common-services/realtime-api/realtime-api.service';
import { RealtimeData } from '../../../Models/RealtimeData';
import { SessioneGraphService } from '../../Services/sessione-graph/sessione-graph.service';

@Component({
  selector: 'app-kanban-sessione',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    KanbanFiltersComponent
],
  templateUrl: './kanban-sessione.component.html',
  styleUrl: './kanban-sessione.component.css'
})
export class KanbanSessioneComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  constructor(
    public kanbanSessioneService: KanbanSessioneService,
    private filtersCommonService: FiltersCommonService,
    private sessionStorageService: SessionStorageService,
    public checkErrorsService: CheckErrorsService,
    private realtimeApiService: RealtimeApiService,
    private mapService: MapService,
    private sessioneGraphService: SessioneGraphService
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    const allData: VehicleData[] = JSON.parse(this.sessionStorageService.getItem("allData"));
    let kanbanVehicles = allData;
    this.kanbanSessioneService.setKanbanData(kanbanVehicles);
    this.sessioneGraphService.loadChartData$.next(kanbanVehicles);

    this.checkErrorsService.updateAnomalies$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.checkErrorsService.checkErrorsAllToday().pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (responseObj: any) => {
            this.kanbanSessioneService.setKanbanData([]);
            setTimeout(() => {
              const vehiclesData = responseObj.vehicles;
              this.loadRealtimeVehicles(vehiclesData);
            }, 2000);
          },
          error: error => console.error("Errore nell'aggiornamento delle anomalie: ", error)
        });
      },
      error: error => console.error("Errore nella notifica di aggiornamento delle anomalie del kanban: ", error)
    });

    this.filtersCommonService.applyFilters$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe((filters: Filters)=>{
      kanbanVehicles = this.filtersCommonService.applyAllFiltersOnVehicles(allData, filters) as VehicleData[];
      this.kanbanSessioneService.setKanbanData(kanbanVehicles);
      this.sessioneGraphService.loadChartData$.next(kanbanVehicles);
    });
  }

  /**
   * Recupera i dati del realtime dalla chiamata API e unisce i risultati con i veicoli passati
   * @returns veicoli accorpati con ultima posizione
   */
  private loadRealtimeVehicles(vehicles: VehicleData[]): VehicleData[] {
    this.realtimeApiService.getLastRealtime().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (realtimeDataObj: RealtimeData[]) => {
          const realtimeVehicles: VehicleData[] = this.mergeRealtimeData(vehicles, realtimeDataObj);
          this.kanbanSessioneService.setKanbanData(realtimeVehicles);
          this.sessioneGraphService.loadChartData$.next(realtimeVehicles);
          this.sessionStorageService.setItem("allData", JSON.stringify(realtimeVehicles));
          return realtimeVehicles;
        },
        error: error => console.error("Errore nel caricamento dei dati realtime: ", error)
      });
    return [];
  }

  /**
   * Unisce un array di veicoli con uno di dati realtime
   * @param tableVehicles array di veicoli
   * @param realtimeData dati realtime
   * @returns veicoli accorpati
   */
  private mergeRealtimeData(tableVehicles: VehicleData[], realtimeData: RealtimeData[]): VehicleData[] {
    tableVehicles.forEach(vehicleData => {
      const matchedRealtimeData = realtimeData.find(realtimeData => {
        return realtimeData.vehicle.veId === vehicleData.vehicle.veId;
      });
      if (matchedRealtimeData) {
        vehicleData.realtime = matchedRealtimeData.realtime;
      }
    });
    return tableVehicles;
  }

  showMap(vehicleData: VehicleData) {
    this.mapService.loadMap$.next(vehicleData);
  }
}
