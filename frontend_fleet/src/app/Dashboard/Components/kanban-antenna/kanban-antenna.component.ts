import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
} from '@angular/core';
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
import {
  Filters,
  FiltersCommonService,
} from '../../../Common-services/filters-common/filters-common.service';
import { AntennaGraphService } from '../../Services/antenna-graph/antenna-graph.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { KanbanFiltersComponent } from '../kanban-filters/kanban-filters.component';
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeApiService } from '../../../Common-services/realtime-api/realtime-api.service';
import { RealtimeData } from '../../../Models/RealtimeData';
import { Point } from '../../../Models/Point';
import { SessionApiService } from '../../../Common-services/session/session-api.service';
import { DashboardService } from '../../Services/dashboard/dashboard.service';

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
    KanbanFiltersComponent,
  ],
  templateUrl: './kanban-antenna.component.html',
  styleUrl: './kanban-antenna.component.css',
})
export class KanbanAntennaComponent implements AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();

  today: boolean = true;
  last: boolean = false;

  constructor(
    public kanbanAntennaService: KanbanAntennaService,
    private dashboardService: DashboardService,
    private filtersCommonService: FiltersCommonService,
    private sessionStorageService: SessionStorageService,
    private antennaGraphService: AntennaGraphService,
    private realtimeApiService: RealtimeApiService,
    private mapService: MapService,
    private sessionApiService: SessionApiService,
    public checkErrorsService: CheckErrorsService,
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

    this.verifyCheckDay();

    this.checkErrorsService.updateAnomalies$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.checkErrorsService
            .checkErrorsAllToday()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (responseObj: any) => {
                this.kanbanAntennaService.setKanbanData([]);
                const vehiclesData = responseObj.vehicles;
                console.log('Kanban vehicles fetched: ', vehiclesData);
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

    this.filtersCommonService.applyFilters$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe((filters: Filters) => {
        kanbanVehicles = this.filtersCommonService.applyAllFiltersOnVehicles(
          allData,
          filters
        ) as VehicleData[];
        this.kanbanAntennaService.setKanbanData(kanbanVehicles);
        this.antennaGraphService.loadChartData$.next(kanbanVehicles);
      });

    this.handleCheckDaySwitch();

    this.cd.detectChanges();
  }

  private handleCheckDaySwitch(){
    this.checkErrorsService.switchCheckDay$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (switchTo: string) => {
        if (switchTo == 'today') {
          this.loadKanbanWithApiCall();
          this.today = true;
          this.last = false;
        } else if (switchTo == 'last') {
          this.getAllLastSessionAnomalies();
          this.today = false;
          this.last = true;
        } else {
          console.error('Cambio controllo a periodo sconosciuto');
        }
      },
      error: (error) =>
        console.error('Errore nel cambio del giorno di controllo: ', error),
    });
  }


  private loadKanban(vehicles: VehicleData[]){
    this.kanbanAntennaService.setKanbanData(vehicles);
    this.antennaGraphService.loadChartData$.next(vehicles);
  }

  private loadKanbanWithApiCall(){
    this.antennaGraphService.resetGraph();
    this.kanbanAntennaService.clearVehicles();

    this.checkErrorsService.checkErrorsAllToday().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (responseObj: any) => {
        const lastUpdate = responseObj.lastUpdate;
        const vehiclesData = responseObj.vehicles;
        this.loadRealtimeVehicles(vehiclesData, lastUpdate);
      },
      error: error => console.error("Errore nella chiamata per il controllo degli errori di oggi: ", error)
    });
  }

  private getAllLastSessionAnomalies() {
    this.antennaGraphService.resetGraph();
    this.kanbanAntennaService.clearVehicles();

    this.sessionApiService.getAllLastSessionAnomalies().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responseObj: any) => {
          const vehiclesData: VehicleData[] = responseObj.vehicles;
          console.log("Last session vehiclesData fetched: ", vehiclesData);
          try {
            if (vehiclesData && vehiclesData.length > 0) {
              const lastUpdate = responseObj.lastUpdate;
              this.sessionStorageService.setItem("lastUpdate", responseObj.lastUpdate);
              this.loadRealtimeVehicles(vehiclesData, lastUpdate);
              this.antennaGraphService.loadChartData$.next(vehiclesData);
            }
          } catch (error) {
            console.error("Error processing last session vehicles:", error);
          }
        },
        error: error => console.error("Errore nel recupero delle ultime sessioni dei veicoli: ", error)
      });
  }

  /**
   * Recupera i dati del realtime dalla chiamata API e unisce i risultati con i veicoli passati
   * @returns veicoli accorpati con ultima posizione realtime
   */
  private loadRealtimeVehicles(vehicles: VehicleData[], lastUpdate: string): VehicleData[] {
    this.realtimeApiService
      .getAllLastRealtime()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (realtimeDataObj: RealtimeData[]) => {
          const realtimeVehicles: VehicleData[] = this.mergeRealtimeData(
            vehicles,
            realtimeDataObj
          );
          this.kanbanAntennaService.setKanbanData(realtimeVehicles);
          this.sessionStorageService.setItem(
            'allData',
            JSON.stringify(realtimeVehicles)
          );
          this.kanbanAntennaService.setKanbanData(realtimeVehicles);
          this.antennaGraphService.loadChartData$.next(realtimeVehicles);
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

  /**
   * Permette di caricare la mappa con i dati della posizione realtime di un veicolo
   * @param vehicleData dati del veicolo di cui visualizzare la posizione
   */
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
        gps: null,
        antenna: vehicleData.anomalies[0].antenna,
        detection_quality: null,
        session: null,
        session_count: 0,
        antenna_count: 0,
        gps_count: 0
      },
    };
    this.mapService.initMap$.next({
      point: new Point(realtimeData.realtime.latitude, realtimeData.realtime.longitude)
    });
    this.mapService.loadPosition$.next(realtimeData);
  }

  /**
   * Imposta il valore del testo dell'ultimo aggiornamento visualizzato sulla dashboard
   * @param lastUpdate stringa ultimo aggiornamento
   */
  private updateLastUpdate(lastUpdate: string){
    if(lastUpdate){
      this.sessionStorageService.setItem("lastUpdate", lastUpdate);
      this.dashboardService.lastUpdate.set(lastUpdate);
    }else{
      this.sessionStorageService.setItem("lastUpdate", "recente");
      this.dashboardService.lastUpdate.set("recente");
    }
  }

  /**
   * Controlla se il segnale del lastUpdate è oggi o recente
   */
  private verifyCheckDay(){
    const lastUpdate = this.dashboardService.lastUpdate();
    if(lastUpdate){
      if (lastUpdate != "recente") {
        this.today = true;
        this.last = false;
      } else {
        this.today = false;
        this.last = true;
      }
    }else{
      this.today = false;
      this.last = true;
    }

    this.cd.detectChanges();
  }
}
