import { WorkSite } from './../../../Models/Worksite';
import { SessionApiService } from './../../Services/session/session-api.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Session } from '../../../Models/Session';
import { first, forkJoin, skip, Subject, switchMap, takeUntil, filter } from 'rxjs';
import { VehiclesApiService } from '../../Services/vehicles/vehicles-api.service';
import { Vehicle } from '../../../Models/Vehicle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ErrorGraphsService } from '../../Services/error-graphs/error-graphs.service';
import { BlackboxGraphsService } from '../../Services/blackbox-graphs/blackbox-graphs.service';
import { CheckErrorsService } from '../../Services/check-errors/check-errors.service';
import { CommonService } from '../../../Common services/common service/common.service';
import { RowFilterComponent } from "../row-filter/row-filter.component";
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { SessionStorageService } from '../../../Common services/sessionStorage/session-storage.service';
import { FilterService } from '../../Services/filter/filter.service';
import { SortService } from '../../Services/sort/sort.service';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    MatTooltipModule,
    MatSortModule,
    RowFilterComponent
],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements OnDestroy, AfterViewInit{
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;

  private readonly destroy$: Subject<void> = new Subject<void>();

  allVehicles: any[] = [];
  vehicleTableData = new MatTableDataSource<Vehicle>();
  tableMaxLength: number = 0;

  sessions: Session[] = [];
  vehicleIds: Number[] = [];

  displayedColumns: string[] = ['targa','cantiere', 'GPS', 'antenna', 'sessione'];



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private errorGraphService: ErrorGraphsService,
    private blackboxGraphService: BlackboxGraphsService,
    private vehicleApiService: VehiclesApiService,
    private filterService: FilterService,
    private sessionStorageService: SessionStorageService,
    private sessionApiService: SessionApiService,
    private checkErrorsService: CheckErrorsService,
    private sortService: SortService,
    private cd: ChangeDetectorRef
  ){
  }

  ngAfterViewInit(): void {
    this.handlErrorGraphClick(); // Subscribe a click nel grafico degli errori
    this.handleBlackBoxGraphClick(); // Subscribe a click nel grafico dei blackbox
    this.handleCantiereFilter(); //Subscribe a scelta nel filtro dei cantieri

    this.allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));

    if (this.allVehicles) {
      this.vehicleTableData.data = this.allVehicles;
      this.tableMaxLength = this.vehicleTableData.data.length;
      this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
      this.cd.detectChanges();
      this.vehicleTable.renderRows();
      this.loadGraphs(this.allVehicles);
    } else {
      this.fillTable(); // Riempi la tabella con i dati se non ci sono nel sessionStorage
    }
  }

  /**
   * Gestisce l'aggiunta di un filtro aggiungendo i dati dei veicoli filtrati alla tabella
   */
  private handleCantiereFilter(){
    this.filterService.filterTableByCantiere$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (cantieri: string[])=>{
        const tableVehicles = JSON.parse(this.sessionStorageService.getItem("tableData"));
        this.vehicleTableData.data = this.allVehicles.length > 0 ? this.filterService.filterTableByCantieri(this.allVehicles, cantieri) as any : this.filterService.filterTableByCantieri(tableVehicles, cantieri) as any;
        this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
        this.cd.detectChanges();
        this.loadGraphs(this.vehicleTableData.data);
      },
      error: error => console.error("Errore nella ricezione del filtro per la tabella: ", error)
    });
  }

  /**
   * Gestisce il click sul grafico degli errori, riempendo la tabella e caricando il grafico dei blackbox di conseguenza
   */
  private handlErrorGraphClick(){
    //riempe tabella con i dati senza filtri
    this.checkErrorsService.fillTable$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (tableVehicles: any[]) => {
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
          this.vehicleTableData.data = this.sortService.sortByCantiereAsc(vehicles);
        } else {
          this.vehicleTableData.data = this.sortService.sortByCantiereDesc(vehicles);
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
        break;
    }
    this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
  }

  /**
 * Riempe la tabella con i dati dei veicoli
 */
  fillTable() {
    this.vehicleTableData.data = [];
    this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
    forkJoin({
      vehicles: this.vehicleApiService.getAllVehicles(),
      anomaliesVehicles: this.checkErrorsService.checkErrorsAllToday(),
      lastValidSessions: this.sessionApiService.getAllVehiclesLastValidSession()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({
        vehicles,
        anomaliesVehicles,
        lastValidSessions
      }: {
        vehicles: Vehicle[],
        anomaliesVehicles: any[],
        lastValidSessions: any[]
      }) => {
        try {
          if (vehicles && vehicles.length > 0) {

            // Accorpamento anomalie di sessione
            vehicles.forEach(vehicle => {
              // Accorpamento anomalie dei dispositivi nella sessione
              vehicle.anomalySessions = anomaliesVehicles
                .filter(anomalyVehicle => anomalyVehicle.veId === vehicle.veId && anomalyVehicle.sessions?.length > 0)
                .flatMap(anomalyVehicle => anomalyVehicle.sessions || []); // Se non ci sono sessioni, restituisci un array vuoto

              // Accorpamento anomalia di ultima sessione
              if (vehicle.veId) {
                const anomalyVehicle = anomaliesVehicles.find(anomaly => anomaly.veId === vehicle.veId);
                // Se l'anomalia esiste, la assegno, altrimenti assegno una stringa vuota
                if (anomalyVehicle && anomalyVehicle.anomaliaSessione) {
                console.log(anomalyVehicle);
                  vehicle.anomaliaSessione = anomalyVehicle.anomaliaSessione;
                } else {
                  vehicle.anomaliaSessione = ""; // Se non c'è anomaliaSessione, assegno una stringa vuota
                }
              }

              // Accorpamento ultima sessione valida
              const lastSession = lastValidSessions.find(lastSession => lastSession.veId === vehicle.veId);
              vehicle.lastValidSession = lastSession ? lastSession.lastValidSession : null; // Se non c'è una sessione valida, metto null
            });

            // Aggiornamento tabella
            this.vehicleTableData.data = [...this.vehicleTableData.data, ...vehicles];
            this.sessionStorageService.setItem("tableData", JSON.stringify(this.vehicleTableData.data));
            this.vehicleTable.renderRows();

          }



          this.sessionStorageService.setItem("allVehicles", JSON.stringify(vehicles));// Inserimento veicoli in sessionstorage
          this.loadGraphs(vehicles);// Carica i grafici dopo il caricamento della tabella
          this.cd.detectChanges();
          console.log(vehicles);
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
   * Carica la tabella con i dati dei veicoli inclusi dal grafico (quando viene premuto su uno spicchio)
   * @param vehicles dati dei veicoli
   */
  fillTableWithGraph(vehicles: any){
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
  onGraphClick(vehicles: any[]){
    this.sessionStorageService.setItem("tableData", JSON.stringify(vehicles));
    this.filterService.updateFilterOptions$.next(vehicles);
    this.fillTableWithGraph(vehicles);
    this.loadGraphs(vehicles);
  }


  /**
   * Funzione da chiamare quando i dati sono completamente caricati
   * @param newVehicles da questi veicoli come input ai grafici per il caricamento
   */
  loadGraphs(newVehicles: any[]) {
    this.errorGraphService.loadChartData(newVehicles);
    this.blackboxGraphService.loadChartData(newVehicles);
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
   * Richiama controllo errore antenna
   * @param vehicle veicolo da controllare
   * @returns risultato del controllo sul GPS
   */
  checkAntennaError(vehicle: any): string | null {
    return this.checkErrorsService.checkAntennaError(vehicle);
  }
  /**
   * Richiama controllo errore sessione
   * @param vehicle veicolo da controllare
   * @returns risultato del controllo sul GPS
   */
  checkSessionError(vehicle: any): string | null {
    return this.checkErrorsService.checkSessionError(vehicle);
  }

}
