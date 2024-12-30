import { AntennaFilterService } from './../../../Common-services/antenna-filter/antenna-filter.service';
import { SessionApiService } from './../../Services/session/session-api.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Session } from '../../../Models/Session';
import { forkJoin, skip, Subject, takeUntil, catchError, of, tap } from 'rxjs';
import { VehiclesApiService } from '../../../Common-services/vehicles service/vehicles-api.service';
import { Vehicle } from '../../../Models/Vehicle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ErrorGraphsService } from '../../Services/error-graphs/error-graphs.service';
import { BlackboxGraphsService } from '../../Services/blackbox-graphs/blackbox-graphs.service';
import { CheckErrorsService } from '../../Services/check-errors/check-errors.service';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { SortService } from '../../../Common-services/sort/sort.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { GpsFilterService } from '../../../Common-services/gps-filter/gps-filter.service';

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

  vehicleTableData = new MatTableDataSource<Vehicle>();
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
    private vehicleApiService: VehiclesApiService,
    private cantieriFilterService: CantieriFilterService,
    private gpsFilterService: GpsFilterService,
    private antennaFilterService: AntennaFilterService,
    private plateFilterService: PlateFilterService,
    private sessionStorageService: SessionStorageService,
    private sessionApiService: SessionApiService,
    private checkErrorsService: CheckErrorsService,
    private sortService: SortService,
    private cd: ChangeDetectorRef
  ){
  }

  ngAfterViewInit(): void {
    const allVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("allVehicles")); //array di tutti i veicoli

    this.handlErrorGraphClick(); // Subscribe a click nel grafico degli errori
    this.handleBlackBoxGraphClick(); // Subscribe a click nel grafico dei blackbox
    this.handleCantiereFilter(); //Subscribe a scelta nel filtro dei cantieri
    this.handleGpsFilter();
    this.handleAntennaFilter();


    this.plateFilterService.filterByPlateResearch$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (research: string) => {
        if(this.sessionStorageService.getItem("errorSlice")){
          const errorVehicles = JSON.parse(this.sessionStorageService.getItem("errorVehicles"));
          this.vehicleTableData.data = this.plateFilterService.filterVehiclesByPlateResearch(research, errorVehicles);
        }else if(this.sessionStorageService.getItem("blackboxSlice")){
          const blackboxVehicles = JSON.parse(this.sessionStorageService.getItem("blackboxVehicles"));
          this.vehicleTableData.data = this.plateFilterService.filterVehiclesByPlateResearch(research, blackboxVehicles);
        }else{
          this.vehicleTableData.data = this.plateFilterService.filterVehiclesByPlateResearch(research, allVehicles);
        }
        this.vehicleTable.renderRows();
      },
      error: error => console.error("Errore nel filtro delle targhe: ", error)
    });

    if (allVehicles) {
      this.vehicleTableData.data = allVehicles;
      this.tableMaxLength = allVehicles.length;
      this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
      this.vehicleTable.renderRows();
      this.loadGraphs(allVehicles);
      this.loading = false;
      this.cd.detectChanges();
    } else {
      this.fillTable(); // Riempi la tabella con i dati se non ci sono nel sessionStorage
    }
  }

  /**
   * Gestisce l'aggiunta di un filtro aggiungendo i dati dei veicoli filtrati alla tabella
   */
  private handleCantiereFilter() {
    this.cantieriFilterService.filterTableByCantiere$.pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (cantieri: string[]) => {
          let vehicles = [];

          const errorSlice = this.sessionStorageService.getItem("errorSlice");
          const blackboxSlice = this.sessionStorageService.getItem("blackboxSlice");

          if (errorSlice) {
            const errorGraphVehicles = this.blackboxGraphService.checkErrorGraphSlice();
            vehicles = this.cantieriFilterService.filterVehiclesByCantieri(errorGraphVehicles, cantieri) as any[];
          } else if (blackboxSlice) {
            const blackboxgraphVehicles = this.errorGraphService.checkBlackBoxSlice();
            vehicles = this.cantieriFilterService.filterVehiclesByCantieri(blackboxgraphVehicles, cantieri) as any[];
          } else {
            const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
            vehicles = this.cantieriFilterService.filterVehiclesByCantieri(allVehicles, cantieri) as any[];
          }

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

  handleGpsFilter() {
    this.gpsFilterService.filterTableByGps$.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (selections: string[]) => {
          const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
          const gpsCheckSeries = this.checkErrorsService.checkVehiclesGpsErrors(allVehicles); //[0] funzionante [1] warning [2] error

          let filteredVehicles: Vehicle[] = [];

          if (selections.includes("all")) {
            filteredVehicles = allVehicles;
          } else {
            if (selections.includes("Funzionante")) {
              filteredVehicles = [...filteredVehicles, ...gpsCheckSeries[0]];
            }
            if (selections.includes("Warning")) {
              filteredVehicles = [...filteredVehicles, ...gpsCheckSeries[1]];
            }
            if (selections.includes("Errore")) {
              filteredVehicles = [...filteredVehicles, ...gpsCheckSeries[2]];
            }
          }

          filteredVehicles = filteredVehicles.filter((vehicle, index, self) =>
            index === self.findIndex(v => v.veId === vehicle.veId)
          );

          this.vehicleTableData.data = selections.length > 0 ? filteredVehicles : [];

          this.vehicleTable.renderRows();
        },

        error: error => console.error("Errore nel filtro dei gps: ", error)
      });
  }

  handleAntennaFilter(){
    this.antennaFilterService.filterTableByAntenna$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (selections: string[]) => {
        const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
        const antennaCheck = this.checkErrorsService.checkVehiclesAntennaErrors(allVehicles);
        const vehiclesBlackboxData = this.blackboxGraphService.getAllRFIDVehicles(allVehicles);
        let filteredVehicles: Vehicle[] = [];

        if (selections.includes("all")) {
          filteredVehicles = allVehicles;
        } else {
          if (selections.includes("Blackbox")) {
            filteredVehicles = [...filteredVehicles, ...vehiclesBlackboxData.blackboxOnly];
          }
          if (selections.includes("Blackbox+antenna")) {
            filteredVehicles = [...filteredVehicles, ...vehiclesBlackboxData.blackboxWithAntenna];
          }
          if (selections.includes("Funzionante")) {
            filteredVehicles = [...filteredVehicles, ...antennaCheck[0]];
          }
          if (selections.includes("Errore")) {
            filteredVehicles = [...filteredVehicles, ...antennaCheck[2]];
          }
        }

        //rimozione duplicati
        filteredVehicles = filteredVehicles.filter((vehicle, index, self) =>
          index === self.findIndex(v => v.veId === vehicle.veId)
        );

        this.vehicleTableData.data = filteredVehicles;

        this.vehicleTable.renderRows();
      },
      error: error => console.error("Errore nel filtro delle antenne: ", error)
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
    const vehicles = this.vehicleTableData.data;

    switch (column) {
      case 'cantiere':
        if (sortDirection == "asc") {
          this.vehicleTableData.data = this.sortService.sortVehiclesByCantiereAsc(vehicles);
        } else {
          this.vehicleTableData.data = this.sortService.sortVehiclesByCantiereDesc(vehicles);
        }
        this.vehicleTable.renderRows();
        break;

      case 'targa':
        if (sortDirection == "asc") {
          this.vehicleTableData.data = this.sortService.sortVehiclesByPlateAsc(vehicles);
        } else {
          this.vehicleTableData.data = this.sortService.sortVehiclesByPlateDesc(vehicles);
        }
        this.vehicleTable.renderRows();
        break;
      case 'sessione':
        if (sortDirection == "asc") {
          this.vehicleTableData.data = this.sortService.sortVehiclesBySessioneAsc(vehicles);
        } else {
          this.vehicleTableData.data = this.sortService.sortVehiclesBySessioneDesc(vehicles);
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
    //nascondi i grafici
    this.blackboxGraphService.resetGraphs();
    this.errorGraphService.resetGraphs();

    this.vehicleTableData.data = []; //inizializzazione tabella vuota
    this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
    forkJoin({
      vehicles: this.vehicleApiService.getAllVehicles().pipe(
        tap(() => {
          this.loadingProgress+=33.3;
          this.loadingText = "Caricamento veicoli...";
          this.cd.detectChanges();
        }),
        catchError((error) => {
          console.error("Errore caricamento vehicles:", error);
          return of([]);
        })
      ),
      anomaliesVehicles: this.checkErrorsService.checkErrorsAllToday().pipe(
        tap(() => {
          this.loadingProgress+=33.3;
          this.loadingText = "Caricamento veicoli con anomalie...";
          this.cd.detectChanges();
        }),
        catchError((error) => {
          console.error("Errore caricamento anomaliesVehicles:", error);
          return of([]);
        })
      ),
      lastValidSessions: this.sessionApiService.getAllVehiclesLastValidSession().pipe(
        tap(() => {
          this.loadingProgress+=33.3;
          this.loadingText = "Caricamento sessioni valide...";
          this.cd.detectChanges();
        }),
        catchError((error) => {
          console.error("Errore caricamento lastValidSessions:", error);
          return of([]);
        })
      )
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({
        vehicles,
        anomaliesVehicles,
        lastValidSessions
      }: {
        vehicles: Vehicle[];
        anomaliesVehicles: any[];
        lastValidSessions: any[];
      }) => {
        try {
          if (vehicles && vehicles.length > 0) {
            vehicles.forEach((vehicle) => {
              vehicle.anomalySessions = anomaliesVehicles
                .filter(anomalyVehicle => anomalyVehicle.veId === vehicle.veId && anomalyVehicle.sessions?.length > 0)
                .flatMap(anomalyVehicle => anomalyVehicle.sessions || []);

              const anomalyVehicle = anomaliesVehicles.find(anomaly => anomaly.veId === vehicle.veId);
              vehicle.anomaliaSessione = anomalyVehicle?.anomaliaSessione || "";

              const lastSession = lastValidSessions.find(lastSession => lastSession.veId === vehicle.veId);
              vehicle.lastValidSession = lastSession ? lastSession.lastValidSession : null;
            });

            this.vehicleTableData.data = [...this.vehicleTableData.data, ...vehicles];
            this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
            this.vehicleTable.renderRows();
          }

          this.sessionStorageService.setItem("allVehicles", JSON.stringify(vehicles));
          this.loadGraphs(vehicles);
          this.loading = false;
          this.cd.detectChanges();
          this.tableMaxLength = vehicles.length;
          this.cd.detectChanges();
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
   * Carica la tabella con i dati dei veicoli passati per parametro
   * @param vehicles dati dei veicoli
   */
  fillTableWithVehicles(vehicles: Vehicle[]){
    // Se ci sono veicoli, aggiorna la tabella
    if (vehicles.length > 0) {
      this.vehicleTableData.data = vehicles; // Modifica la tabella
      this.vehicleTable.renderRows();
    }
  }


  /**
 * Richiama le funzioni per il riempimento della tabella in base al filtro dei grafici (inserendo i nuovi veicoli nel sessionstorage) e la sincronizzazione di quest'ultimi
 * @param vehicles veicoli da caricare
 */
  onGraphClick(vehicles: Vehicle[]){
    /*filtrare i veicoli per cantiere*/
    this.sessionStorageService.setItem("tableData", JSON.stringify(vehicles)); //imposta tableData in sessionstorage
    this.cantieriFilterService.updateCantieriFilterOptions$.next(vehicles); //aggiorna le opzioni del filtro dei cantieri
    this.fillTableWithVehicles(vehicles); //riempe la tabella
    this.loadGraphs(vehicles); //carica i grafici
  }


  /**
   * Richiama le funzioni per il caricamento del grafico degli errori e del grafico dei blackbox
   * @param newVehicles da questi veicoli come input ai grafici per il caricamento
   */
  loadGraphs(newVehicles: Vehicle[]) {
    this.errorGraphService.loadChartData(newVehicles);
    this.blackboxGraphService.loadChartData(newVehicles);
  }

  /**
   * Calcola da quanti giorni le sessioni di un veicolo sono in errore
   * @param vehicle veicolo da cui prendere l'ultimo evento
   * @returns differenza in giorni: oggi - lastevent
   */
  calculateSessionErrorDays(vehicle: Vehicle){
    return this.checkErrorsService.calculateSessionErrorDays(vehicle);
  }

  /**
   * Controlla se si conosce l'appartenenza di un veicolo ad un cantiere
   * @param vehicle veicolo da controllare
   * @returns il nome del cantiere o la non assegnazione a nessuno
   */
  checkWorksite(vehicle: any) {
    if (vehicle?.worksite && vehicle.worksite.name) {
      return vehicle.worksite.name;
    } else {
      return "Non assegnato.";
    }
  }

  /**
   * Richiama controllo errore GPS
   * @param vehicle veicolo da controllare
   * @returns risultato del controllo sul GPS
   */
  checkGpsError(vehicle: any): string | null {
    return this.checkErrorsService.checkGpsError(vehicle);
  }

  /**
   * Richiama controllo errore GPS
   * @param vehicle veicolo da controllare
   * @returns risultato del controllo sul GPS
   */
  checkGpsWarning(vehicle: any): string | null {
    return this.checkErrorsService.checkGPSWarning(vehicle);
  }

  /**
   * Richiama controllo errore antenna
   * @param vehicle veicolo da controllare
   * @returns risultato del controllo sull'antenna
   */
  checkAntennaError(vehicle: any): string | null {
    return this.checkErrorsService.checkAntennaError(vehicle);
  }
  /**
   * Richiama controllo errore sessione
   * @param vehicle veicolo da controllare
   * @returns risultato del controllo sulla sessione
   */
  checkSessionError(vehicle: any): string | null {
    return this.checkErrorsService.checkSessionError(vehicle);
  }

}
