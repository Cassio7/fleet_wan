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
import {MatSlideToggleChange, MatSlideToggleModule} from '@angular/material/slide-toggle';
import { RealtimeData } from '../../../Models/RealtimeData';
import { RealtimeApiService } from '../../../Common-services/realtime-api/realtime-api.service';
import { MapService } from '../../../Common-services/map/map.service';

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
    public checkErrorsService: CheckErrorsService,
    private errorGraphService: ErrorGraphsService,
    private blackboxGraphService: BlackboxGraphsService,
    private antennaGraphService: AntennaGraphService,
    private gpsGraphService: GpsGraphService,
    private cantieriFilterService: CantieriFilterService,
    private sessionApiService: SessionApiService,
    private sessionStorageService: SessionStorageService,
    private realtimeApiService: RealtimeApiService,
    private filtersCommonService: FiltersCommonService,
    private mapService: MapService,
    private sortService: SortService,
    private cd: ChangeDetectorRef
  ){
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.handlErrorGraphClick(); // Subscribe a click nel grafico degli errori
      this.handleBlackBoxGraphClick(); // Subscribe a click nel grafico dei blackbox
      this.handleAllFilters();
    });

    this.checkErrorsService.switchCheckDay$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (switchTo: string) => {
        if(switchTo == "today"){
          this.fillTable();
        }else if(switchTo == "last"){
          this.getAllLastSession();
        }else{
          console.error("Cambio controllo a periodo sconosciuto");
        }
      },
      error: error => console.error("Errore nel cambio del giorno di controllo: ", error)
    });

    this.fillTable();
    this.getLastRealtime();
  }

  private handleAllFilters(){
    this.filtersCommonService.applyFilters$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (filters: Filters) => {
        const allData = JSON.parse(this.sessionStorageService.getItem("allData"));
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
   * Riempe la tabella con i dati dei veicoli
   */
  private fillTable() {
    this.sessionStorageService.clear();
    console.log("CHIAMATO FILL TABLE!");
    //nascondi i grafici
    this.antennaGraphService.resetGraph();
    this.errorGraphService.resetGraphs();
    this.vehicleTableData.data = []; //inizializzazione tabella vuota
    this.simulateProgress(0.2, 10);
    this.checkErrorsService.checkErrorsAllRanged(new Date(), new Date())
    .then((responseObj: any) => {
      const vehiclesData = responseObj.vehicles;
      console.log("vehiclesData fetched: ", vehiclesData);
      try {
        if (vehiclesData && vehiclesData.length > 0) {
          this.vehicleTableData.data = [...vehiclesData];  // Assicurati che vehiclesData.vehicles sia un array di veicoli
          this.sessionStorageService.setItem("allData", JSON.stringify(vehiclesData));  // Salva l'array di veicoli
          this.vehicleTable.renderRows();  // Rende le righe della tabella
          this.loadGraphs(vehiclesData);
        }
      } catch (error) {
        console.error("Error processing vehicles:", error);
      }
    }).catch(error => console.error("Errore nel caricamento iniziale dei dati: ", error));
  }

  private getLastRealtime() {
    this.realtimeApiService.getLastRealtime().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (realtimeDataObj: RealtimeData[]) => {
        console.log("realtimeDataObj: ", realtimeDataObj);
        const tableVehicles: VehicleData[] = this.vehicleTableData.data;
        tableVehicles.forEach(vehicleData => {
          const matchedRealtimeData = realtimeDataObj.find(realtimeData => {
            if(realtimeData){
              return parseInt(realtimeData.vehicle.veId) === vehicleData.vehicle.veId;
            }else{
              return false;
            }
          });
          if (matchedRealtimeData) {
            vehicleData.realtime = matchedRealtimeData.realtime;
          }
        });
        console.log("tableVehicles after realtime accorpation: ", tableVehicles);
        this.vehicleTableData.data = tableVehicles;
        this.vehicleTable.renderRows();
      },
      error: error => console.error("Errore nel caricamento dei dati realtime: ", error)
    });
  }

  /**
   * Riempie la tabella con i dati delle ultime sessioni dei veicoli
   */
  getAllLastSession() {
    this.sessionStorageService.clear();
    console.log("CHIAMATO GET ALL LAST SESSION!");
    this.antennaGraphService.resetGraph();
    this.errorGraphService.resetGraphs();

    this.vehicleTableData.data = [];

    this.sessionApiService.getAllLastSession().pipe(takeUntil(this.destroy$))
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

  onVehicleClick(vehicleData: VehicleData){
    this.mapService.loadMap$.next(vehicleData);
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
    this.errorGraphService.loadGraphData$.next(newVehicles);
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
