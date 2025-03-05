import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { KanbanFiltersComponent } from '../kanban-filters/kanban-filters.component';
import { skip, Subject, take, takeUntil } from 'rxjs';
import {
  Filters,
  FiltersCommonService,
} from '../../../Common-services/filters-common/filters-common.service';
import { VehicleData } from '../../../Models/VehicleData';
import { GpsGraphService } from '../../Services/gps-graph/gps-graph.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeApiService } from '../../../Common-services/realtime-api/realtime-api.service';
import { RealtimeData } from '../../../Models/RealtimeData';
import { Point } from '../../../Models/Point';
import { SessionApiService } from '../../../Common-services/session/session-api.service';

@Component({
  selector: 'app-kanban-gps',
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
    KanbanFiltersComponent,
  ],
  templateUrl: './kanban-gps.component.html',
  styleUrl: './kanban-gps.component.css',
})
export class KanbanGpsComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  constructor(
    public kanbanGpsService: KanbanGpsService,
    private filtersCommonService: FiltersCommonService,
    private sessionStorageService: SessionStorageService,
    public checkErrorsService: CheckErrorsService,
    private realtimeApiService: RealtimeApiService,
    private mapService: MapService,
    private gpsGraphService: GpsGraphService,
    private sessionApiService: SessionApiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    const allData: VehicleData[] = JSON.parse(
      this.sessionStorageService.getItem('allData')
    );
    let kanbanVehicles = allData;

    this.loadKanban(kanbanVehicles);

    this.checkErrorsService.updateAnomalies$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.checkErrorsService
            .checkErrorsAllToday()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (responseObj: any) => {
                this.kanbanGpsService.setKanbanData([]);
                const vehiclesData = responseObj.vehicles;
                const lastUpdate = responseObj.lastUpdate;
                this.loadRealtimeVehicles(vehiclesData, lastUpdate);
              },
              error: (error) =>
                console.error(
                  "Errore nell'aggiornamento delle anomalie: ",
                  error
                ),
            });
        },
        error: (error) =>
          console.error(
            'Errore nella notifica di aggiornamento delle anomalie del kanban: ',
            error
          ),
      });

    this.handleCheckDaySwitch();

    this.filtersCommonService.applyFilters$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe((filters: Filters) => {
        kanbanVehicles = this.filtersCommonService.applyAllFiltersOnVehicles(allData, filters) as VehicleData[];
        this.kanbanGpsService.setKanbanData(kanbanVehicles);
        this.gpsGraphService.loadChartData$.next(kanbanVehicles);
      });

    this.cd.detectChanges();
  }

  private handleCheckDaySwitch(){
    this.checkErrorsService.switchCheckDay$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (switchTo: string) => {
        if (switchTo == 'today') {
          this.loadKanbanWithApiCall();
        } else if (switchTo == 'last') {
          this.getAllLastSessionAnomalies();
        } else {
          console.error('Cambio controllo a periodo sconosciuto');
        }
      },
      error: (error) =>
        console.error('Errore nel cambio del giorno di controllo: ', error),
    });
  }

  private getAllLastSessionAnomalies() {
    this.gpsGraphService.resetGraph();
    this.kanbanGpsService.clearVehicles();

    this.sessionApiService.getAllLastSessionAnomalies().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responseObj: any) => {
          const vehiclesData: VehicleData[] = responseObj.vehicles;
          console.log("Last session vehiclesData fetched: ", vehiclesData);
          try {
            if (vehiclesData && vehiclesData.length > 0) {
              this.sessionStorageService.setItem("lastUpdate", responseObj.lastUpdate);
              const lastUpdate = responseObj.lastUpdate;
              this.loadRealtimeVehicles(vehiclesData, lastUpdate);
              this.gpsGraphService.loadChartData$.next(vehiclesData);
            }
          } catch (error) {
            console.error("Error processing last session vehicles:", error);
          }
        },
        error: error => console.error("Errore nel recupero delle ultime sessioni dei veicoli: ", error)
      });
  }

  private loadKanban(vehicles: VehicleData[]){
    this.kanbanGpsService.setKanbanData(vehicles);
    this.gpsGraphService.loadChartData$.next(vehicles);
  }

  private loadKanbanWithApiCall(){
    this.gpsGraphService.resetGraph();
    this.kanbanGpsService.clearVehicles();
    this.checkErrorsService.checkErrorsAllToday().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (responseObj: any) => {
        const lastUpdate = responseObj.lastUpdate;
        const vehiclesData = responseObj.vehicles;
        this.sessionStorageService.setItem("lastUpdate", lastUpdate);
        this.loadRealtimeVehicles(vehiclesData, lastUpdate);
      },
      error: error => console.error("Errore nella chiamata per il controllo degli errori di oggi: ", error)
    });
  }

  /**
   * Imposta il valore del testo dell'ultimo aggiornamento visualizzato sulla dashboard
   * @param lastUpdate stringa ultimo aggiornamento
   */
  private updateLastUpdate(lastUpdate: string){
    this.sessionStorageService.setItem("lastUpdate", lastUpdate);
    this.checkErrorsService.updateLastUpdate$.next(lastUpdate);
  }

  /**
   * Recupera i dati del realtime dalla chiamata API e unisce i risultati con i veicoli passati
   * @returns veicoli accorpati con ultima posizione
   */
  private loadRealtimeVehicles(vehicles: VehicleData[], lastUpdate: string): VehicleData[] {
    this.realtimeApiService
      .getAllLastRealtime()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (realtimeDataObj: RealtimeData[]) => {
          const realtimeVehicles: VehicleData[] = this.mergeRealtimeData(vehicles,realtimeDataObj);
          this.kanbanGpsService.setKanbanData(realtimeVehicles);
          this.gpsGraphService.loadChartData$.next(realtimeVehicles);
          console.log("realtime vehicles set: ", realtimeVehicles);
          this.sessionStorageService.setItem('allData',JSON.stringify(realtimeVehicles));
          this.updateLastUpdate(lastUpdate);
          return realtimeVehicles;
        },
        error: (error) =>
          console.error('Errore nel caricamento dei dati realtime: ', error),
      });
    return [];
  }

  /**
   * Unisce un array di veicoli con uno di dati realtime
   * @param tableVehicles array di veicoli
   * @param realtimeData dati realtime
   * @returns veicoli accorpati
   */
  private mergeRealtimeData(
    tableVehicles: VehicleData[],
    realtimeData: RealtimeData[]
  ): VehicleData[] {
    tableVehicles.forEach((vehicleData) => {
      const matchedRealtimeData = realtimeData.find((realtimeData) => {
        return realtimeData.vehicle.veId === vehicleData.vehicle.veId;
      });
      if (matchedRealtimeData) {
        vehicleData.realtime = matchedRealtimeData.realtime;
      }
    });
    return tableVehicles;
  }

  showMap(vehicleData: VehicleData) {
    const realtimeData: RealtimeData = {
      vehicle: {
        plate: vehicleData.vehicle.plate,
        worksite: vehicleData.vehicle.worksite || null,
        veId: vehicleData.vehicle.veId,
      },
      realtime: vehicleData.realtime,
      anomaly: {
        date: vehicleData.anomalies[0].date,
        gps: vehicleData.anomalies[0].gps,
        antenna: null,
        detection_quality: null,
        session: null,
        session_count: null
      },
    };
    this.mapService.initMap$.next({
      point: new Point(realtimeData.realtime.latitude, realtimeData.realtime.longitude)
    });
    this.mapService.loadPosition$.next(realtimeData);
  }
}
