import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { takeUntil, skip, Subject } from 'rxjs';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { VehicleData } from '../../../Models/VehicleData';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { AntennaGraphService } from '../../Services/antenna-graph/antenna-graph.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { KanbanFiltersComponent } from "../kanban-filters/kanban-filters.component";
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeApiService } from '../../../Common-services/realtime-api/realtime-api.service';
import { RealtimeData } from '../../../Models/RealtimeData';

@Component({
  selector: 'app-kanban-antenna',
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
  templateUrl: './kanban-antenna.component.html',
  styleUrl: './kanban-antenna.component.css'
})
export class KanbanAntennaComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  constructor(
    public kanbanAntennaService: KanbanAntennaService,
    private filtersCommonService: FiltersCommonService,
    private sessionStorageService: SessionStorageService,
    private antenanGraphService: AntennaGraphService,
    private realtimeApiService: RealtimeApiService,
    private mapService: MapService,
    public checkErrorsService: CheckErrorsService
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    const allData: VehicleData[] = JSON.parse(this.sessionStorageService.getItem("allData"));
    let kanbanVehicles = allData;

    this.getVehiclesErrorsData();
    this.checkErrorsService.updateAnomalies$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.getVehiclesErrorsData();
      },
      error: error => console.error("Errore nella notifica di aggiornamento delle anomalie del kanban: ", error)
    });

    this.filtersCommonService.applyFilters$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe((filters: Filters)=>{
      kanbanVehicles = this.filtersCommonService.applyAllFiltersOnVehicles(allData, filters) as VehicleData[];
      this.kanbanAntennaService.setKanbanData(kanbanVehicles);
      this.antenanGraphService.loadChartData$.next(kanbanVehicles);
    });
  }

  /**
   * Esegue una chiamata tramite un servizio che recupera i dati dei veicoli
   * e delle loro anomalie nella giornata di oggi
   */
  private getVehiclesErrorsData(){
    this.checkErrorsService.checkErrorsAllToday().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (responseObj: any) => {
        this.kanbanAntennaService.setKanbanData([]);
        setTimeout(() => {
          const vehiclesData = responseObj.vehicles;
          this.loadRealtimeVehicles(vehiclesData);
        }, 2000);
      },
      error: error => console.error("Errore nell'aggiornamento delle anomalie: ", error)
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
          console.log("kanban sessione realtime data fetched: ", realtimeDataObj);
          const realtimeVehicles: VehicleData[] = this.realtimeApiService.mergeVehiclesWithRealtime(vehicles, realtimeDataObj) as VehicleData[];
          this.kanbanAntennaService.setKanbanData(realtimeVehicles);
          this.antenanGraphService.loadChartData$.next(realtimeVehicles);
          this.sessionStorageService.setItem("allData", JSON.stringify(realtimeVehicles));
          return realtimeVehicles;
        },
        error: error => console.error("Errore nel caricamento dei dati realtime: ", error)
      });
    return [];
  }

  showMap(vehicleData: VehicleData) {
    this.mapService.loadMap$.next(vehicleData);
  }
}
