import { SessionApiService } from '../../../Common-services/session/session-api.service';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { Session } from '../../../Models/Session';
import {
  catchError,
  map,
  Observable,
  skip,
  Subject,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ErrorGraphsService } from '../../Services/error-graphs/error-graphs.service';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { VehicleData } from '../../../Models/VehicleData';
import { AntennaGraphService } from '../../Services/antenna-graph/antenna-graph.service';
import {
  Filters,
  FiltersCommonService,
} from '../../../Common-services/filters-common/filters-common.service';
import { GpsGraphService } from '../../Services/gps-graph/gps-graph.service';
import {
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { RealtimeData } from '../../../Models/RealtimeData';
import { RealtimeApiService } from '../../../Common-services/realtime-api/realtime-api.service';
import { MapService } from '../../../Common-services/map/map.service';
import { Router } from '@angular/router';
import { SessioneGraphService } from '../../Services/sessione-graph/sessione-graph.service';
import { Point } from '../../../Models/Point';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';
import { LoginService } from '../../../Common-services/login service/login.service';
import { DashboardService } from '../../Services/dashboard/dashboard.service';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatSortModule,
    MatSlideToggleModule
],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class TableComponent implements OnDestroy, OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;

  private readonly destroy$: Subject<void> = new Subject<void>();

  tableLoaded: boolean = false;
  vehicleTableData = new MatTableDataSource<VehicleData>();
  tableMaxLength: number = 0;

  loadingProgress: number = 0;
  loadingText: string = '';
  today = true;

  displayedColumns: string[] = [
    'Servizio',
    'Targa',
    'Cantiere',
    'GPS',
    'Antenna',
    "Detection quality",
    'Sessione',
    'Map',
  ];

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    public checkErrorsService: CheckErrorsService,
    private gpsGraphService: GpsGraphService,
    private sessioneGraphService: SessioneGraphService,
    private antennaGraphService: AntennaGraphService,
    private cantieriFilterService: CantieriFilterService,
    private sessionApiService: SessionApiService,
    private sessionStorageService: SessionStorageService,
    private realtimeApiService: RealtimeApiService,
    private filtersCommonService: FiltersCommonService,
    private dashboardService: DashboardService,
    private kanbanTableService: KanbanTableService,
    private mapService: MapService,
    private sortService: SortService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.vehicleTableData.sort = this.sort;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.handleAllFilters(); //subscribe all'applicazione di tutti i filtri
    });

    // this.vehicleTableData.connect().subscribe((data) => {
    //   console.log('data added: ', data);
    // });

    this.handleCheckDaySwitch();

    this.checkErrorsService.updateAnomalies$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadingProgress = 0;
          this.vehicleTableData.data = [];
          setTimeout(() => {
            this.fillTable();
          }, 2000);
        },
        error: (error) =>
          console.error(
            'Errore nella notifica di aggiornamento della anomalie: ',
            error
          ),
      });

    const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
    const activeFilters = this.kanbanTableService.filtersValue();
    if(allData && activeFilters){
      const filteredData = this.filtersCommonService.applyAllFiltersOnVehicles(allData, activeFilters) as VehicleData[]
      this.vehicleTableData.data = filteredData;
      this.loadGraphs(filteredData);
      this.loadingProgress = 100;
    }else if(allData){
      this.vehicleTableData.data = allData;
      this.loadGraphs(allData);
      this.loadingProgress = 100;
      setTimeout(() => {
        this.tableLoaded = true;
      }, 500);
    }else{
      this.fillTable();
    }
  }

  /**
   * Gestisce la sottoscrizione al subject per il cambio della data dei controlli
   */
  private handleCheckDaySwitch(){
    this.checkErrorsService.switchCheckDay$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (switchTo: string) => {
        if (switchTo == 'today') {
          this.fillTable();
          if(!this.displayedColumns.includes("Map")) this.displayedColumns.push("Map"); //Riaggiunta colonna mappa se mancante
        } else if (switchTo == 'last') {
          this.displayedColumns = this.displayedColumns.filter(col => col !== "Map"); //Rimozione colonna mappa
          this.getAllLastSessionAnomalies();
        } else {
          console.error('Cambio controllo a periodo sconosciuto');
        }
      },
      error: (error) =>
        console.error('Errore nel cambio del giorno di controllo: ', error),
    });
  }

  /**
   * Gestisce la sottoscrizione all'applicazione di tutti i filtri
   */
  private handleAllFilters() {
    this.filtersCommonService.applyFilters$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (filters: Filters) => {
          const allData = JSON.parse(this.sessionStorageService.getItem('allData'));
          const filteredVehicles = this.filtersCommonService.applyAllFiltersOnVehicles(allData,filters) as VehicleData[];
          const sortedFilteredVehicles = this.sortVehiclesByMatSort(filteredVehicles);
          this.vehicleTableData.data = sortedFilteredVehicles;
          this.vehicleTable.renderRows();
          this.loadGraphs(filteredVehicles);
        },
      });
  }


  /**
   * Ordina i veicoli passati in base ai valori del MatSort della tabella
   * @param vehicles vehiclesData da ordinare
   * @returns array di vehiclesData ordinato
   */
  sortVehiclesByMatSort(vehicles: VehicleData[]): VehicleData[] {
    const column = this.sort.active;
    const sortDirection = this.sort.direction;

    switch (column) {
      case 'Cantiere':
        if (sortDirection == 'asc') {
          return this.sortService.sortVehiclesByCantiereAsc(vehicles) as VehicleData[];
        } else {
          return this.sortService.sortVehiclesByCantiereDesc(vehicles) as VehicleData[];
        }
      case 'Targa':
        if (sortDirection == 'asc') {
          return this.sortService.sortVehiclesByPlateAsc(vehicles) as VehicleData[];
        } else {
          return this.sortService.sortVehiclesByPlateDesc(vehicles) as VehicleData[];
        }
      case 'Sessione':
        if (sortDirection == 'asc') {
          return this.sortService.sortVehiclesBySessioneAsc(vehicles) as VehicleData[];
        } else {
          return this.sortService.sortVehiclesBySessioneDesc(vehicles) as VehicleData[];
        }
    }
    return vehicles;
  }


  /**
   * Riempe la tabella con i dati recuperati dalla chiamata API
   */
  private fillTable() {
    console.log("CHIAMATO FILL TABLE!");
    this.resetGraphs();

    // this.errorGraphService.resetGraphs();
    this.vehicleTableData.data = [];
    this.checkErrorsService.checkErrorsAllToday().pipe(takeUntil(this.destroy$), tap(() => {
      this.loadingProgress+=50;
      this.loadingText = "Caricamento dei veicoli...";
    })).subscribe({
      next: (responseObj: any) => {
        const vehiclesData = responseObj.vehicles;
        this.updateLastUpdate(responseObj.lastUpdate);
        this.addLastRealtime(vehiclesData).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (mergedVehicles: VehicleData[]) => {
            this.sessionStorageService.setItem("allData", JSON.stringify(mergedVehicles));
            const activeFilters = this.kanbanTableService.filtersValue();
            if(activeFilters){
              const filteredMergedVehicles: VehicleData[] = this.filtersCommonService.applyAllFiltersOnVehicles(mergedVehicles, activeFilters) as VehicleData[];
              this.vehicleTableData.data = filteredMergedVehicles;
              this.loadGraphs(filteredMergedVehicles);
            }else{
              this.vehicleTableData.data = mergedVehicles;
              this.loadGraphs(mergedVehicles);
            }
          },
          error: error => console.error("Errore nell'aggiunta dei realtime ai veicoli: ", error)
        });
        this.sort = this.sortService.resetMatSort(this.sort);
      },
      error: (err) => {
        console.error("Errore nel caricamento iniziale dei dati: ", err);
      }
    });
  }

  /**
   * Imposta il valore del testo dell'ultimo aggiornamento visualizzato sulla dashboard
   * @param lastUpdate stringa ultimo aggiornamento
   */
  private updateLastUpdate(lastUpdate: string){
    if(lastUpdate){
      this.sessionStorageService.setItem("lastUpdate", lastUpdate);
      this.dashboardService.lastUpdate.set(lastUpdate);
      this.dashboardService.lastUpdate.set(lastUpdate);
    }else{
      this.sessionStorageService.setItem("lastUpdate", "recente");
      this.dashboardService.lastUpdate.set("recente");
      this.dashboardService.lastUpdate.set("recente");
    }
  }

  /**
   * Recupera i dati dell'ultima posizione di ogni veicolo effettuando una chiamata tramite un servizio
   * @param vehicles veicoli a cui aggiungere il realtime
   * @returns veicoli associati con il realtime
   */
  private addLastRealtime(vehicles: VehicleData[]): Observable<VehicleData[]> {
    return this.realtimeApiService.getAllLastRealtime().pipe(
      tap(() => {
        this.loadingProgress += 50;
        this.loadingText = "Caricamento dati del tempo reale...";
      }),
      map((realtimeDataObj: RealtimeData[]) => {
        console.log("realtime data fetched from dashboard: ", realtimeDataObj);

        const mergedVehicles: VehicleData[] = this.realtimeApiService.mergeVehiclesWithRealtime(vehicles, realtimeDataObj) as VehicleData[];

        return mergedVehicles;
      }),
      catchError(error => {
        console.error("Errore nel caricamento dei dati realtime: ", error);
        return throwError(() => error);
      })
    );
  }


  /**
   * Ottiene i dati dell'ultimo andamento di ciscun veicolo
   */
  getAllLastSessionAnomalies() {
    this.resetGraphs();
    this.vehicleTableData.data = [];

    this.sessionApiService.getAllLastSessionAnomalies().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responseObj: any) => {
        const vehiclesData = responseObj.vehicles;
        this.sessionStorageService.setItem("allData", JSON.stringify(vehiclesData));
        this.updateLastUpdate(responseObj.lastUpdate);
        const activeFilters = this.kanbanTableService.filtersValue();
        if(activeFilters){
          const filteredVehicles: VehicleData[] = this.filtersCommonService.applyAllFiltersOnVehicles(vehiclesData, activeFilters) as VehicleData[];
          this.vehicleTableData.data = filteredVehicles;
          this.loadGraphs(filteredVehicles);
        }else{
          this.vehicleTableData.data = vehiclesData;
          this.loadGraphs(vehiclesData);
        }
        this.sort = this.sortService.resetMatSort(this.sort);
        },
        error: error => console.error("Errore nel recupero delle ultime sessioni dei veicoli: ", error)
      });
  }

  /**
   * Mostra il dettaglio di un veicolo navigando alla sua scheda mezzo
   * @param veId
   */
  displayVehicleDetail(veId: number) {
    this.router.navigate(['/dettaglio-mezzo', veId]);
  }

  /**
   * Mostra la mappa con l'ultima posizione del veicolo specificato
   * @param vehicleData veicolo di cui mostrare l'ultima posizione registrata
   */
  showMap(vehicleData: VehicleData) {
    const realtimeData: RealtimeData = {
      vehicle: {
        plate: vehicleData.vehicle.plate,
        worksite: vehicleData.vehicle.worksite || null,
        veId: vehicleData.vehicle.veId,
      },
      realtime: vehicleData.realtime,
      anomaly: vehicleData.anomalies[0],
    };
    if(realtimeData.realtime){
      this.mapService.initMap$.next({
        point: new Point(realtimeData.realtime.latitude, realtimeData.realtime.longitude)
      });
      this.mapService.loadPosition$.next(realtimeData);
    }else{
      console.log("Nessun dato realtime!");
    }
  }

  /**
   * Comportamento al click su un grafico
   * @param vehiclesData dati dei veicoli
   */
  onGraphClick(vehiclesData: VehicleData[]) {
    this.cantieriFilterService.updateCantieriFilterOptions$.next(vehiclesData);
    if(vehiclesData){
      this.vehicleTableData.data = vehiclesData;
    }
    this.loadGraphs(vehiclesData);
  }

  /**
   * Carica il grafico degli errori e delle antenne
   * @param newVehicles veicoli con cui caricare i grafici
   */
  loadGraphs(newVehicles: VehicleData[]) {
    // this.errorGraphService.loadGraphData$.next(newVehicles);
    this.gpsGraphService.loadChartData$.next(newVehicles);
    this.antennaGraphService.loadChartData$.next(newVehicles);
    this.sessioneGraphService.loadChartData$.next(newVehicles);
  }

  resetGraphs(){
    this.antennaGraphService.resetGraph();
    this.sessioneGraphService.resetGraph();
    this.gpsGraphService.resetGraph();
  }

  /**
   * Controlla se è stato assegnato un cantiere ad un veicolo
   * @param vehicleData veicolo da controllare
   * @returns "Non assegnato" se non è stato assegnato alcun cantiere al veicolo
   * @returns nome del cantiere se il veicolo ha un cantiere assegnato
   */
  checkWorksite(vehicleData: VehicleData) {
    return this.cantieriFilterService.getVehicleWorksite(vehicleData);
  }
}
