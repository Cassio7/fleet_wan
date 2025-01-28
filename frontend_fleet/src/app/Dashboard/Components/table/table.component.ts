import { AntennaFilterService } from './../../../Common-services/antenna-filter/antenna-filter.service';
import { SessionApiService } from '../../../Common-services/session/session-api.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Session } from '../../../Models/Session';
import { forkJoin, skip, Subject, takeUntil, catchError, of, tap, filter, first } from 'rxjs';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { Vehicle } from '../../../Models/Vehicle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ErrorGraphsService } from '../../Services/error-graphs/error-graphs.service';
import { BlackboxGraphsService } from '../../Services/blackbox-graphs/blackbox-graphs.service';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { GpsFilterService } from '../../../Common-services/gps-filter/gps-filter.service';
import { SessionFilterService } from '../../../Common-services/session-filter/session-filter.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { VehicleData } from '../../../Models/VehicleData';
import { CommonService } from '../../../Common-services/common service/common.service';
import { AntennaGraphService } from '../../Services/antenna-graph/antenna-graph.service';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { GpsGraphService } from '../../Services/gps-graph/gps-graph.service';
import {MatSlideToggleChange, MatSlideToggleModule} from '@angular/material/slide-toggle';
import { RealtimeData } from '../../../Models/RealtimeData';
import { RealtimeApiService } from '../../../Common-services/realtime-api/realtime-api.service';
import { MapService } from '../../../Common-services/map/map.service';
import { Router } from '@angular/router';

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
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnDestroy, AfterViewInit {
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;

  private readonly destroy$: Subject<void> = new Subject<void>();

  vehicleTableData = new MatTableDataSource<VehicleData>();
  tableMaxLength: number = 0;

  loadingProgress: number = 0;
  loadingText: string = "";
  loading: boolean = true;

  displayedColumns: string[] = ['tipologia','targa','cantiere', 'GPS', 'antenna', 'sessione', 'map'];

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    public checkErrorsService: CheckErrorsService,
    private errorGraphService: ErrorGraphsService,
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

    this.checkErrorsService.switchCheckDay$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (switchTo: string) => {
        if(switchTo == "today"){
          this.fillTable();
        } else if(switchTo == "last"){
          this.getAllLastSessionAnomalies();
        } else {
          console.error("Cambio controllo a periodo sconosciuto");
        }
      },
      error: error => console.error("Errore nel cambio del giorno di controllo: ", error)
    });

    this.checkErrorsService.updateAnomalies$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.vehicleTableData.data = [];
        this.simulateProgress(1);
        this.cd.detectChanges();
        setTimeout(() => {
          this.fillTable();
        }, 2000);
      },
      error: error => console.error("Errore nella notifica di aggiornamento della anomalie: ", error)
    });

    this.fillTable();
  }

  /**
   * Gestisce la sottoscrizione all'applicazione di tutti i filtri
   */
  private handleAllFilters() {
    this.filtersCommonService.applyFilters$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (filters: Filters) => {
        const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
        const filteredVehicles = this.filtersCommonService.applyAllFiltersOnVehicles(allData, filters);
        this.vehicleTableData.data = filteredVehicles;
        this.vehicleTable.renderRows();
        this.antennaGraphService.loadChartData$.next(filteredVehicles);
        this.errorGraphService.loadGraphData$.next(filteredVehicles);
      }
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
        if (sortDirection == "asc") {
          this.vehicleTableData.data = this.sortService.sortVehiclesByCantiereAsc(vehiclesData);
        } else {
          this.vehicleTableData.data = this.sortService.sortVehiclesByCantiereDesc(vehiclesData);
        }
        this.vehicleTable.renderRows();
        break;

      case 'targa':
        if (sortDirection == "asc") {
          this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(vehiclesData) as VehicleData[];
        } else {
          this.vehicleTableData.data = this.sortService.sortVehiclesByPlateDesc(vehiclesData) as VehicleData[];
        }
        this.vehicleTable.renderRows();
        break;
      case 'sessione':
        if (sortDirection == "asc") {
          this.vehicleTableData.data = this.sortService.sortVehiclesBySessioneAsc(vehiclesData);
        } else {
          this.vehicleTableData.data = this.sortService.sortVehiclesBySessioneDesc(vehiclesData);
        }
        this.vehicleTable.renderRows();
        break;
    }
    this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
  }

  /**
   * Riempe la tabella con i dati recuperati dalla chiamata API
   */
  private async fillTable() {
    this.sessionStorageService.clear();
    console.log("CHIAMATO FILL TABLE!");
    this.antennaGraphService.resetGraph();
    this.errorGraphService.resetGraphs();
    this.vehicleTableData.data = [];
    await this.simulateProgress(1.5);
    this.checkErrorsService.checkErrorsAllToday().subscribe({
      next: (responseObj: any) => {
        const vehiclesData = responseObj.vehicles;
        console.log("vehiclesData fetched: ", vehiclesData);
        try {
          if (vehiclesData && vehiclesData.length > 0) {
            this.vehicleTableData.data = [...vehiclesData];
            this.sessionStorageService.setItem("allData", JSON.stringify(vehiclesData));
            this.vehicleTable.renderRows();
            this.loadGraphs(vehiclesData);
          }
        } catch (error) {
          console.error("Error processing vehicles:", error);
        }
      },
      error: (err) => {
        console.error("Errore nel caricamento iniziale dei dati: ", err);
      }
    });
    this.getLastRealtime();
  }

  /**
   * Recupera i dati del realtime dalla chiamata API e unisce i risultati con i veicoli della tabella
   */
  private getLastRealtime() {
    this.realtimeApiService.getLastRealtime().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (realtimeDataObj: RealtimeData[]) => {
          const tableVehicles: VehicleData[] = this.mergeRealtimeData(this.vehicleTableData.data, realtimeDataObj);
          this.vehicleTableData.data = tableVehicles;
          this.sessionStorageService.setItem("allData", JSON.stringify(tableVehicles));
          this.vehicleTable.renderRows();
        },
        error: error => console.error("Errore nel caricamento dei dati realtime: ", error)
      });
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
        return parseInt(realtimeData.vehicle.veId) === vehicleData.vehicle.veId;
      });
      if (matchedRealtimeData) {
        vehicleData.realtime = matchedRealtimeData.realtime;
      }
    });
    return tableVehicles;
  }

  /**
   * Ottiene i dati dell'ultimo andamento di ciscun veicolo
   */
  getAllLastSessionAnomalies() {
    this.sessionStorageService.clear();
    console.log("CHIAMATO GET ALL LAST SESSION!");
    this.antennaGraphService.resetGraph();
    this.errorGraphService.resetGraphs();

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
              this.vehicleTable.renderRows();
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
   * Simula il progresso di un caricamento
   * @param seconds durata totale in secondi del caricamento
   */
  async simulateProgress(seconds: number): Promise<void> {
    this.loading = true;
    this.loadingProgress = 0;
    this.cd.detectChanges();
    let progress = 0;
    const progressPerSec = 100 / seconds;
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (progress < 100) {
                progress += progressPerSec;
                this.loadingProgress = Math.min(progress, 100);
            } else {
                this.loading = false;
                clearInterval(interval);
                resolve();
            }
            this.cd.detectChanges();
        }, 1000);
    });
}


  /**
   * Riempe la tabella con i veicoli passati
   * @param vehicles
   */
  fillTableWithVehicles(vehicles: VehicleData[]) {
    if (vehicles.length > 0) {
      this.vehicleTableData.data = vehicles;
      this.vehicleTable.renderRows();
    }
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
    console.log("chiamata ShowMap()");
    this.mapService.loadMap$.next(vehicleData);
  }

  /**
   * Comportamento al click su un grafico
   * @param vehiclesData dati dei veicoli
   */
  onGraphClick(vehiclesData: VehicleData[]) {
    this.cantieriFilterService.updateCantieriFilterOptions$.next(vehiclesData);
    this.fillTableWithVehicles(vehiclesData);
    this.loadGraphs(vehiclesData);
  }

  /**
   * Carica il grafico degli errori e delle antenne
   * @param newVehicles veicoli con cui caricare i grafici
   */
  loadGraphs(newVehicles: VehicleData[]) {
    this.errorGraphService.loadGraphData$.next(newVehicles);
    this.antennaGraphService.loadChartData$.next(newVehicles);
  }

  /**
   * Controlla se è stato assegnato un cantiere ad un veicolo
   * @param vehicleData veicolo da controllare
   * @returns "Non assegnato" se non è stato assegnato alcun cantiere al veicolo
   * @returns nome del cantiere se il veicolo ha un cantiere assegnato
   */
  checkWorksite(vehicleData: VehicleData) {
    if (vehicleData.vehicle?.worksite && vehicleData.vehicle.worksite.name) {
      return vehicleData.vehicle.worksite.name;
    } else {
      return "Non assegnato";
    }
  }
}
