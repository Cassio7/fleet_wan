import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import {
  catchError,
  firstValueFrom,
  map,
  Observable,
  skip,
  Subject,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import {
  Filters,
  FiltersCommonService,
} from '../../../Common-services/filters-common/filters-common.service';
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeApiService, RealtimeData } from '../../../Common-services/realtime-api/realtime-api.service';
import { SessionApiService } from '../../../Common-services/session/session-api.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { SvgService } from '../../../Common-services/svg/svg.service';
import { Point } from '../../../Models/Point';
import { Session } from '../../../Models/Session';
import { VehicleData } from '../../../Models/VehicleData';
import { AntennaGraphService } from '../../Services/antenna-graph/antenna-graph.service';
import { DashboardService } from '../../Services/dashboard/dashboard.service';
import { GpsGraphService } from '../../Services/gps-graph/gps-graph.service';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';
import { SessioneGraphService } from '../../Services/sessione-graph/sessione-graph.service';
import { openSnackbar } from '../../../Utils/snackbar';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    MatSlideToggleModule,
  ],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class TableComponent implements OnDestroy, OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;

  private readonly destroy$: Subject<void> = new Subject<void>();

  private snackbar = inject(MatSnackBar);

  tableLoaded: boolean = false;
  vehicleTableData = new MatTableDataSource<VehicleData>();
  tableMaxLength: number = 0;

  loadingProgress: number = 0;
  loadingText: string = '';
  today = true;
  displayedColumns: string[] = [
    'Active',
    'Targa',
    'Servizio',
    'Cantiere',
    'GPS',
    'Antenna',
    'Detection quality',
    'Sessione',
    'Map',
  ];

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    public checkErrorsService: CheckErrorsService,
    public svgService: SvgService,
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
    this.checkCheckDay();
    this.vehicleTableData.sort = this.sort;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.handleAllFilters(); //subscribe all'applicazione di tutti i filtri
    });

    this.handleCheckDaySwitch();

    this.checkErrorsService.updateAnomalies$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async () => {
          this.loadingProgress = 0;
          this.vehicleTableData.data = [];
          await this.fillTable();
          openSnackbar(this.snackbar, "Dati aggiornati con successo! ✔");
        },
        error: (error) =>
          console.error(
            'Errore nella notifica di aggiornamento della anomalie: ',
            error
          ),
      });

    const allData = JSON.parse(this.sessionStorageService.getItem('allData'));
    const activeFilters = this.kanbanTableService.filtersValue();
    if (allData && activeFilters) {
      const filteredData = this.filtersCommonService.applyAllFiltersOnVehicles(
        allData,
        activeFilters
      ) as VehicleData[];
      this.vehicleTableData.data = filteredData;
      this.loadGraphs(filteredData);
      this.loadingProgress = 100;
    } else if (allData) {
      this.vehicleTableData.data = allData;
      this.loadGraphs(allData);
      this.loadingProgress = 100;
      setTimeout(() => {
        this.tableLoaded = true;
      }, 500);
    } else {
      this.fillTable();
    }
  }

  private checkCheckDay(){
    const lastUpdate = this.sessionStorageService.getItem("lastUpdate");
    if(lastUpdate == "recente"){
      this.today = false;
    }else{
      this.today = true;
    }
    this.cd.detectChanges();
  }

  /**
   * Gestisce la sottoscrizione al subject per il cambio della data dei controlli
   */
  private handleCheckDaySwitch() {
    this.checkErrorsService.switchCheckDay$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (switchTo: string) => {
          if (switchTo == 'today') {
            this.today = true;
            this.fillTable();
            if (!this.displayedColumns.includes('Map'))
              this.displayedColumns.push('Map'); //Riaggiunta colonna mappa se mancante
          } else if (switchTo == 'last') {
            this.today = false;
            this.displayedColumns = this.displayedColumns.filter(
              (col) => col !== 'Map'
            ); //Rimozione colonna mappa //Rimozione colonna mappa
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
          const allData = JSON.parse(
            this.sessionStorageService.getItem('allData')
          );
          const filteredVehicles =
            this.filtersCommonService.applyAllFiltersOnVehicles(
              allData,
              filters
            ) as VehicleData[];
          const sortedFilteredVehicles =
            this.sortVehiclesByMatSort(filteredVehicles);
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
    return this.sortService.sortVehiclesByMatSort(vehicles, this.sort) as VehicleData[];
  }

  /**
   * Riempe la tabella con i dati recuperati dalla chiamata API
   */

  private async fillTable(): Promise<void> {
    this.resetGraphs();
    this.vehicleTableData.data = [];

    try {
      const responseObj: any = await firstValueFrom(
        this.checkErrorsService.checkErrorsAllToday().pipe(
          takeUntil(this.destroy$),
          tap(() => {
            this.loadingProgress += 50;
            this.loadingText = 'Caricamento dei veicoli...';
          })
        )
      );

      const vehiclesData = responseObj.vehicles;
      this.updateLastUpdate(responseObj.lastUpdate);

      const mergedVehicles = await firstValueFrom(
        this.addLastRealtime(vehiclesData).pipe(takeUntil(this.destroy$))
      );

      this.sessionStorageService.setItem(
        'allData',
        JSON.stringify(mergedVehicles)
      );

      const activeFilters = this.kanbanTableService.filtersValue();
      const filteredVehicles = activeFilters
        ? (this.filtersCommonService.applyAllFiltersOnVehicles(
            mergedVehicles,
            activeFilters
          ) as VehicleData[])
        : mergedVehicles;

      this.vehicleTableData.data = filteredVehicles;
      this.loadGraphs(filteredVehicles);

      this.kanbanTableService.tableLoaded$.next();
      this.mapService.resizeMap$.next();
      this.sort = this.sortService.resetMatSort(this.sort);

    } catch (error) {
      console.error('Errore durante il caricamento dei dati: ', error);
    }
  }


  /**
   * Imposta il valore del testo dell'ultimo aggiornamento visualizzato sulla dashboard
   * @param lastUpdate stringa ultimo aggiornamento
   */
  private updateLastUpdate(lastUpdate: string) {
    if (lastUpdate) {
      this.sessionStorageService.setItem('lastUpdate', lastUpdate);
      this.dashboardService.lastUpdate.set(lastUpdate);
    } else {
      this.sessionStorageService.setItem('lastUpdate', 'recente');
      this.dashboardService.lastUpdate.set('recente');
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
        this.loadingText = 'Caricamento dati del tempo reale...';
      }),
      map((realtimeDataObj: RealtimeData[]) => {

        const mergedVehicles: VehicleData[] =
          this.realtimeApiService.mergeVehiclesWithRealtime(
            vehicles,
            realtimeDataObj
          ) as VehicleData[];

        return mergedVehicles;
      }),
      catchError((error) => {
        console.error('Errore nel caricamento dei dati realtime: ', error);
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

    this.sessionApiService
      .getAllLastSessionAnomalies()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responseObj: any) => {
          const vehiclesData = responseObj.vehicles;
          this.sessionStorageService.setItem(
            'allData',
            JSON.stringify(vehiclesData)
          );
          this.updateLastUpdate(responseObj.lastUpdate);
          const activeFilters = this.kanbanTableService.filtersValue();
          if (activeFilters) {
            const filteredVehicles: VehicleData[] =
              this.filtersCommonService.applyAllFiltersOnVehicles(
                vehiclesData,
                activeFilters
              ) as VehicleData[];
            this.vehicleTableData.data = filteredVehicles;
            this.loadGraphs(filteredVehicles);
          } else {
            this.vehicleTableData.data = vehiclesData;
            this.loadGraphs(vehiclesData);
          }
          this.kanbanTableService.tableLoaded$.next();
          this.sort = this.sortService.resetMatSort(this.sort);
        },
        error: (error) =>
          console.error(
            'Errore nel recupero delle ultime sessioni dei veicoli: ',
            error
          ),
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
    if (realtimeData.realtime) {
      this.mapService.initMap$.next({
        point: new Point(
          realtimeData.realtime.latitude,
          realtimeData.realtime.longitude
        ),
      });
      this.mapService.loadPosition$.next(realtimeData);
    } else {
      console.error('No realtime data!');
    }
  }

  /**
   * Comportamento al click su un grafico
   * @param vehiclesData dati dei veicoli
   */
  onGraphClick(vehiclesData: VehicleData[]) {
    this.cantieriFilterService.updateCantieriFilterOptions$.next(vehiclesData);
    if (vehiclesData) {
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

  resetGraphs() {
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
