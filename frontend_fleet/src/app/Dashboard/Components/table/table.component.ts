import { AntennaFilterService } from './../../../Common-services/antenna-filter/antenna-filter.service';
import { SessionApiService } from './../../Services/session/session-api.service';
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
    MatSortModule
],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements OnDestroy, AfterViewInit{
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;

  private readonly destroy$: Subject<void> = new Subject<void>();

  vehicleTableData = new MatTableDataSource<VehicleData>();
  tableMaxLength: number = 0;

  loadingProgress: number = 0;
  loadingText: string = "";
  loading: boolean = true;



  displayedColumns: string[] = ['tipologia','targa','cantiere', 'GPS', 'antenna', 'sessione'];



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private errorGraphService: ErrorGraphsService,
    private blackboxGraphService: BlackboxGraphsService,
    private antennaGraphService: AntennaGraphService,
    private gpsGraphService: GpsGraphService,
    private cantieriFilterService: CantieriFilterService,
    private gpsFilterService: GpsFilterService,
    private antennaFilterService: AntennaFilterService,
    private plateFilterService: PlateFilterService,
    private sessionFilterService: SessionFilterService,
    private sessionStorageService: SessionStorageService,
    private commonService: CommonService,
    private filtersCommonService: FiltersCommonService,
    public checkErrorsService: CheckErrorsService,
    private sortService: SortService,
    private cd: ChangeDetectorRef
  ){
  }

  ngAfterViewInit(): void {
    const allVehiclesData = JSON.parse(this.sessionStorageService.getItem("allData"));
    setTimeout(() => {
      this.handlErrorGraphClick(); // Subscribe a click nel grafico degli errori
      this.handleBlackBoxGraphClick(); // Subscribe a click nel grafico dei blackbox
      // this.handleCantiereFilter(); //Subscribe a scelta nel filtro dei cantieri
      // this.handleGpsFilter();
      // this.handleAntennaFilter();
      // this.handleSessionFilter();
      this.handleAllFilters();
    });

    this.fillTable();
    // if (allVehiclesData.length>0) {
    //   this.vehicleTableData.data = allVehiclesData;
    //   this.tableMaxLength = allVehiclesData.length;
    //   this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
    //   this.vehicleTable.renderRows();
    //   this.loadGraphs(allVehiclesData);
    //   this.loading = false;
    //   this.cd.detectChanges();
    // } else {
    //   this.fillTable(); // Riempi la tabella con i dati se non ci sono nel sessionStorage
    // }
  }

  private handleAllFilters(){
    const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
    this.filtersCommonService.applyFilters$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (filters: Filters) => {
        const filteredVehicles = this.filtersCommonService.applyAllFiltersOnVehicles(allData, filters);
        this.vehicleTableData.data = filteredVehicles;
        this.vehicleTable.renderRows();
        this.antennaGraphService.loadChartData$.next(filteredVehicles);
        this.gpsGraphService.loadChartData$.next(filteredVehicles);
        this.errorGraphService.loadGraphData$.next(filteredVehicles);
      }
    });
  }



  /**
   * Gestisce l'aggiunta di un filtro aggiungendo i dati dei veicoli filtrati alla tabella
   */
  private handleCantiereFilter() {
    this.cantieriFilterService.filterTableByCantiere$.pipe(
      takeUntil(this.destroy$),
      skip(1)
    )
    .subscribe({
      next: (cantieri: string[]) => {
        let vehicles: VehicleData[] = [];

        const allVehicles: VehicleData[] = JSON.parse(this.sessionStorageService.getItem("allData") || '[]') as VehicleData[];

        vehicles = this.cantieriFilterService.filterVehiclesByCantieri(allVehicles, cantieri);// Filtro veicoli in base ai cantieri

        this.vehicleTableData.data = vehicles;

        this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));

        this.vehicleTable.renderRows();
        this.cd.detectChanges();

        this.loadGraphs(this.vehicleTableData.data);
      },
      error: error => {
        console.error("Error receiving filter for the table: ", error);
      }
    });
  }



  /**
   * Gestisce la sottoscrizione al filtro dei gps, impostando i dati della tabella di conseguenza
   */
  private handleGpsFilter() {
    this.gpsFilterService.filterTableByGps$.pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (selections: string[]) => {
          const allVehicles = JSON.parse(this.sessionStorageService.getItem("allData"));
          const tableVehicles: VehicleData[] = JSON.parse(this.sessionStorageService.getItem("tableData"));

          const vehicles = (tableVehicles && tableVehicles.length > 0) ? tableVehicles : allVehicles;
          const gpsCheckSeries = this.checkErrorsService.checkVehiclesGpsErrors(vehicles); //[0] funzionante [1] warning [2] error
          let selectedVehicles: VehicleData[] = [];
          if (selections.includes("all")) {
            selectedVehicles = vehicles;
          } else {
            if (selections.includes("Funzionante")) {
              selectedVehicles = [...selectedVehicles, ...gpsCheckSeries[0]];
            }
            if (selections.includes("Warning")) {
              selectedVehicles = [...selectedVehicles, ...gpsCheckSeries[1]];
            }
            if (selections.includes("Errore")) {
              selectedVehicles = [...selectedVehicles, ...gpsCheckSeries[2]];
            }
          }

          const filteredVehicles = this.sortService.vehiclesInDefaultOrder(selectedVehicles);

          this.vehicleTableData.data = filteredVehicles.length > 0 ? filteredVehicles : [];

          this.vehicleTable.renderRows();
          this.loadGraphs(this.vehicleTableData.data);
        },

        error: error => console.error("Errore nel filtro dei gps: ", error)
      });
  }


  private handleAntennaFilter() {
    this.antennaFilterService.filterTableByAntenna$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (selections: string[]) => {
        const allVehicles = JSON.parse(this.sessionStorageService.getItem("allData"));
        const tableVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("tableData"));

        const vehicles = (tableVehicles && tableVehicles.length > 0) ? tableVehicles : allVehicles;

        const antennaCheck = this.checkErrorsService.checkVehiclesAntennaErrors(vehicles);
        const vehiclesBlackboxData = this.blackboxGraphService.getAllRFIDVehicles(vehicles);
        let selectedVehicles: VehicleData[] = [];

        if (selections.includes("all")) {
          selectedVehicles = vehicles;
        } else {
          if (selections.includes("Blackbox")) {
            selectedVehicles = [...selectedVehicles, ...vehiclesBlackboxData.blackboxOnly];
          }
          if (selections.includes("Blackbox+antenna")) {
            selectedVehicles = [...selectedVehicles, ...vehiclesBlackboxData.blackboxWithAntenna];
          }
          if (selections.includes("Funzionante")) {
            selectedVehicles = [...selectedVehicles, ...antennaCheck[0]];
          }
          if (selections.includes("Errore")) {
            selectedVehicles = [...selectedVehicles, ...antennaCheck[1]];
          }
        }

        const filteredVehicles = this.sortService.vehiclesInDefaultOrder(selectedVehicles);

        this.vehicleTableData.data = filteredVehicles.length > 0 ? filteredVehicles : [];

        this.vehicleTable.renderRows();
        this.loadGraphs(this.vehicleTableData.data);
      },
      error: error => console.error("Errore nel filtro delle antenne: ", error)
    });
  }


  private handleSessionFilter() {
    this.sessionFilterService.filterTableBySessionStates$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (selections: string[]) => {
        const allData = JSON.parse(this.sessionStorageService.getItem("allData"))
        const allVehicles = allData.map((vehicleData: any) => {
          return vehicleData.vehicle;
        });
        const tableVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("tableData"));

        const vehicles = (tableVehicles && tableVehicles.length > 0) ? tableVehicles : allVehicles;
        const sessionCheck = this.checkErrorsService.checkVehiclesSessionErrors(vehicles); //[0] funzionante [1] errore

        let selectedVehicles: VehicleData[] = [];

        //se "all" è selezionato, aggiungi tutti i veicoli
        if (selections.includes("all")) {
          selectedVehicles = vehicles;
        } else {
          //selezione dei veicoli in base alle opzioni
          if (selections.includes("Funzionante")) {
            selectedVehicles = [...selectedVehicles, ...sessionCheck[0]];
          }
          if (selections.includes("Errore")) {
            selectedVehicles = [...selectedVehicles, ...sessionCheck[1]];
          }
        }

        //filtrare allVehicles per includere solo i veicoli selezionati
        const filteredVehicles = this.sortService.vehiclesInDefaultOrder(selectedVehicles);

        //impostare i dati della tabella con i veicoli filtrati
        this.vehicleTableData.data = filteredVehicles.length > 0 ? filteredVehicles : [];

        this.vehicleTable.renderRows();
        this.loadGraphs(this.vehicleTableData.data);
      },
      error: error => console.error("Errore nel filtro per gli stati di sessione: ", error)
    });
  }



  /**
   * Gestisce il click sul grafico degli errori, riempendo la tabella e caricando il grafico dei blackbox di conseguenza
   */
  private handlErrorGraphClick(){
    this.checkErrorsService.fillTable$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (tableVehicles: any[]) => {
        //if(blackbox vehicles)
        this.onGraphClick(tableVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error)
    });

    //riempre la tabella con solo veicoli funzionanti
    this.errorGraphService.loadFunzionanteData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (workingVehicles: any[]) => {
        this.onGraphClick(workingVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error)
    });

    //riempre la tabella con solo veicoli che presentano warning
    this.errorGraphService.loadWarningData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (warningVehicles: any[]) => {
        this.onGraphClick(warningVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error)
    });

    //riempre la tabella con solo veicoli che presentano errori
    this.errorGraphService.loadErrorData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (errorVehicles: any[]) => {
        this.onGraphClick(errorVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error)
    });
  }

  /**
   * Gestisce il click sul grafico dei blackbox, riempendo la tabella e caricando il grafico degli errori di conseguenza
   */
  private handleBlackBoxGraphClick(){
    this.checkErrorsService.fillTable$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (allVehicles: any[]) => {
        this.onGraphClick(allVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico dei blackbox: ", error)
    });
    this.blackboxGraphService.loadBlackBoxData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (blackBoxVehicles: any[]) => {
        this.onGraphClick(blackBoxVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico dei blackbox: ", error)
    });
    this.blackboxGraphService.loadBlackBoxAntennaData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (blackBoxAntennaVehicles: any[]) => {
        this.onGraphClick(blackBoxAntennaVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico dei blackbox: ", error)
    });
  }

  /**
   * Funzione per ordinamento della tabella in base a colonne (cantiere, targa, session)
   * DA FIXARE PER targa E DA FARE PER session
   * @param event evento da cui prende nome colonna e direzione ordinamento
   */
  onSortChange(event: Sort){
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
          this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(vehiclesData);
        } else {
          this.vehicleTableData.data = this.sortService.sortVehiclesByPlateDesc(vehiclesData);
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
   * Riempe la tabella con i dati dei veicoli
   */
  fillTable() {
    console.log("CHIAMATO FILL TABLE!");
    //nascondi i grafici
    this.antennaGraphService.resetGraph();
    this.errorGraphService.resetGraphs();
    const dateFrom = this.commonService.dateFrom;
    const dateTo = this.commonService.dateTo;
    this.vehicleTableData.data = []; //inizializzazione tabella vuota
    this.simulateProgress(0.2, 10);
    this.checkErrorsService.checkErrorsAllRanged(dateFrom, dateTo).pipe(takeUntil(this.destroy$), first())
    .subscribe({
      next: (vehiclesData: any) => {
        try {
          if (vehiclesData.vehicles && vehiclesData.vehicles.length > 0) {
            this.vehicleTableData.data = [...vehiclesData.vehicles];  // Assicurati che vehiclesData.vehicles sia un array di veicoli
            this.sessionStorageService.setItem("allData", JSON.stringify(vehiclesData.vehicles));  // Salva l'array di veicoli
            this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
            this.vehicleTable.renderRows();  // Rende le righe della tabella
          }
        } catch (error) {
          console.error("Error processing vehicles:", error);
        }
      },
      error: (error) => {
        console.error("Error loading data:", error);
      }
    });
  }

  /**
   * Simula il caricamento della progress bar
   * @param seconds ogni quanti secondi la progress bar deve progredire
   * @param progressPerSec di quanto deve progredire
   */
  simulateProgress(seconds: number, progressPerSec: number) {
    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 100) {
        progress += progressPerSec;  // Aumenta di 10% ogni intervallo
        this.loadingProgress = progress;
      } else {
        this.loading = false;
        clearInterval(interval);  // Ferma l'intervallo quando il progresso raggiunge il 100%
      }
      this.cd.detectChanges();
    }, seconds);  // Ogni secondo incrementa il progresso
  }

  /**
   * Carica la tabella con i dati dei veicoli passati per parametro
   * @param vehicles dati dei veicoli
   */
  fillTableWithVehicles(vehicles: VehicleData[]){
    // Se ci sono veicoli, aggiorna la tabella
    if (vehicles.length > 0) {
      this.vehicleTableData.data = vehicles; // Modifica la tabella
      this.vehicleTable.renderRows();
    }
  }


  /**
 * Richiama le funzioni per il riempimento della tabella in base al filtro dei grafici (inserendo i nuovi veicoli nel sessionstorage) e la sincronizzazione di quest'ultimi
 * @param vehiclesData veicoli da caricare
 */
  onGraphClick(vehiclesData: VehicleData[]){
    /*filtrare i veicoli per cantiere*/
    this.sessionStorageService.setItem("tableData", JSON.stringify(vehiclesData)); //imposta tableData in sessionstorage
    this.cantieriFilterService.updateCantieriFilterOptions$.next(vehiclesData); //aggiorna le opzioni del filtro dei cantieri
    this.fillTableWithVehicles(vehiclesData); //riempe la tabella
    this.loadGraphs(vehiclesData); //carica i grafici
  }


  /**
   * Richiama le funzioni per il caricamento del grafico degli errori e del grafico dei blackbox
   * @param newVehicles da questi veicoli come input ai grafici per il caricamento
   */
  loadGraphs(newVehicles: VehicleData[]) {
    this.errorGraphService.loadChartData(newVehicles);
    this.antennaGraphService.loadChartData$.next(newVehicles);
  }

  /**
   * Calcola da quanti giorni le sessioni di un veicolo sono in errore
   * @param vehicle veicolo da cui prendere l'ultimo evento
   * @returns differenza in giorni: oggi - lastevent
   */
  calculateSessionErrorDays(vehicle: VehicleData){
    return this.checkErrorsService.calculateSessionErrorDays(vehicle);
  }

  /**
   * Controlla se si conosce l'appartenenza di un veicolo ad un cantiere
   * @param vehicle veicolo da controllare
   * @returns il nome del cantiere o la non assegnazione a nessuno
   */
  checkWorksite(vehicleData: VehicleData) {
    if (vehicleData.vehicle?.worksite && vehicleData.vehicle.worksite.name) {
      return vehicleData.vehicle.worksite.name;
    } else {
      return "Non assegnato";
    }
  }
}
