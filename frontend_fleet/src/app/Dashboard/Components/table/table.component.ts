import { SessionApiService } from '../../../Common-services/session/session-api.service';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
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
  skip,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ErrorGraphsService } from '../../Services/error-graphs/error-graphs.service';
import { MatSortModule, Sort } from '@angular/material/sort';
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
export class TableComponent implements OnDestroy, AfterViewInit {
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;

  private readonly destroy$: Subject<void> = new Subject<void>();

  tableLoaded: boolean = false;
  vehicleTableData = new MatTableDataSource<VehicleData>();
  tableMaxLength: number = 0;

  loadingProgress: number = 0;
  loadingText: string = '';
  today = true;

  displayedColumns: string[] = [
    'Tipologia',
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
    private errorGraphService: ErrorGraphsService,
    private gpsGraphService: GpsGraphService,
    private sessioneGraphService: SessioneGraphService,
    private antennaGraphService: AntennaGraphService,
    private cantieriFilterService: CantieriFilterService,
    private sessionApiService: SessionApiService,
    private sessionStorageService: SessionStorageService,
    private realtimeApiService: RealtimeApiService,
    private filtersCommonService: FiltersCommonService,
    private mapService: MapService,
    private sortService: SortService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.handleAllFilters(); //subscribe all'applicazione di tutti i filtri
    });

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
    if(allData){
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

  private handleCheckDaySwitch(){
    this.checkErrorsService.switchCheckDay$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (switchTo: string) => {
        if (switchTo == 'today') {
          this.fillTable();
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
          const filteredVehicles = this.filtersCommonService.applyAllFiltersOnVehicles(allData,filters) as VehicleData[];
          this.vehicleTableData.data = filteredVehicles;
          this.vehicleTable.renderRows();
          this.loadGraphs(filteredVehicles);
        },
      });
  }

  /**
   * Funzione per ordinamento della tabella in base a colonne (cantiere, targa, session)
   * DA FIXARE PER targa E DA FARE PER session
   * @param event evento da cui prende nome colonna e direzione ordinamento
   */
  onSortChange(event: Sort) {
    const column = event.active;
    const sortDirection = event.direction;
    const vehiclesData = this.vehicleTableData.data;

    switch (column) {
      case 'cantiere':
        if (sortDirection == 'asc') {
          this.vehicleTableData.data = this.sortService.sortVehiclesByCantiereAsc(vehiclesData);
        } else {
          this.vehicleTableData.data = this.sortService.sortVehiclesByCantiereDesc(vehiclesData);
        }
        this.vehicleTable.renderRows();
        break;

      case 'targa':
        if (sortDirection == 'asc') {
          this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(vehiclesData) as VehicleData[];
        } else {
          this.vehicleTableData.data = this.sortService.sortVehiclesByPlateDesc(vehiclesData) as VehicleData[];
        }
        this.vehicleTable.renderRows();
        break;
      case 'sessione':
        if (sortDirection == 'asc') {
          this.vehicleTableData.data =
            this.sortService.sortVehiclesBySessioneAsc(vehiclesData);
        } else {
          this.vehicleTableData.data =
            this.sortService.sortVehiclesBySessioneDesc(vehiclesData);
        }
        this.vehicleTable.renderRows();
        break;
    }
    this.sessionStorageService.setItem(
      'tableData',
      JSON.stringify(this.vehicleTableData.data)
    );
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
        console.log("filltable loading progress: ",this.loadingProgress);
        const lastUpdate = responseObj.lastUpdate;
        this.updateLastUpdate(lastUpdate);
        this.setTableData(responseObj.vehicles);
      },
      error: (err) => {
        console.error("Errore nel caricamento iniziale dei dati: ", err);
      }
    });
  }

  /**
   * Imposta i dati della tabella e carica i grafici
   * unendo i risultati con i dati realtime
   * @param vehicles veicoli da cui prendere i dati
   */
  private setTableData(vehicles: VehicleData[]){
    const vehiclesData = vehicles;
    console.log("vehiclesData fetched: ", vehiclesData);
    try {
      if (vehiclesData && vehiclesData.length > 0) {
        this.vehicleTableData.data = [...vehiclesData];
        this.sessionStorageService.setItem("allData", JSON.stringify(vehiclesData));
        this.addLastRealtime();
        this.loadGraphs(vehiclesData);
        console.log("ce so arivato!!");
        setTimeout(() => {
          this.tableLoaded = true;
        }, 500);
        if(this.vehicleTable) this.vehicleTable.renderRows();
      }
    } catch (error) {
      console.error("Error processing vehicles:", error);
    }
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
   * Recupera i dati dell'ultima posizione di ogni veicolo effettuando una chiamata tramite un servizio,
   * poi unisce le posizioni ottenute con i veicoli nella tabella
   */
  private addLastRealtime() {
    this.realtimeApiService.getAllLastRealtime().pipe(tap(() => {
      this.loadingProgress+= 50;
      this.loadingText = "Caricamento dati del tempo reale...";
    }), takeUntil(this.destroy$))
      .subscribe({
        next: (realtimeDataObj: RealtimeData[]) => {
          console.log("realtime loading progress: ",this.loadingProgress);
          console.log("realtime data fetched from dashboard: ", realtimeDataObj);
          const tableVehicles: VehicleData[] = this.realtimeApiService.mergeVehiclesWithRealtime(this.vehicleTableData.data, realtimeDataObj) as VehicleData[];
          this.vehicleTableData.data = tableVehicles;
          this.sessionStorageService.setItem("allData", JSON.stringify(tableVehicles));

          if(this.vehicleTable) this.vehicleTable.renderRows();
        },
        error: error => console.error("Errore nel caricamento dei dati realtime: ", error)
      });
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
          const vehiclesData: VehicleData[] = responseObj.vehicles;
          console.log("Last session vehiclesData fetched: ", vehiclesData);
          try {
            if (vehiclesData && vehiclesData.length > 0) {
              this.vehicleTableData.data = [...vehiclesData];
              this.sessionStorageService.setItem("allData", JSON.stringify(vehiclesData));
              this.sessionStorageService.setItem("lastUpdate", responseObj.lastUpdate);
              this.vehicleTable.renderRows();
              this.addLastRealtime();
              this.loadGraphs(vehiclesData);
            }
          } catch (error) {
            console.error("Error processing last session vehicles:", error);
          }
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
