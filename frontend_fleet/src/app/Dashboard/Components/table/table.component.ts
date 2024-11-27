import { TableService } from './../../Services/table/table.service';
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
import { CommonService } from '../../Services/common service/common.service';
import { RowFilterComponent } from "../row-filter/row-filter.component";
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTableModule,
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

  sessions: Session[] = [];
  vehicleIds: Number[] = [];

  displayedColumns: string[] = ['comune', 'targa', 'GPS', 'antenna', 'sessione'];



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private errorGraphService: ErrorGraphsService,
    private blackboxGraphService: BlackboxGraphsService,
    private vehicleApiService: VehiclesApiService,
    private tableService: TableService,
    private sessionApiService: SessionApiService,
    private checkErrorsService: CheckErrorsService,
    private cd: ChangeDetectorRef
  ){
  }

  ngAfterViewInit(): void {
    this.handlErrorGraphClick(); // Subscribe a click nel grafico degli errori
    this.handleBlackBoxGraphClick(); // Subscribe a click nel grafico dei blackbox
    this.handleCantiereFilter(); //Subscribe a scelta nel filtro dei cantieri

    const storedData = sessionStorage.getItem("allVehicles"); //Inserimento di tutti i veicoli nel sessionStorage
    this.allVehicles = storedData ? JSON.parse(storedData) : []; //Parse da sessionStorage di tutti i veicoli

    if (this.allVehicles) {
      this.vehicleTableData.data = this.allVehicles;
      this.vehicleTable.renderRows();
      this.loadGraphs(this.allVehicles);
    } else {
      this.fillTable(); // Riempi la tabella con i dati se non ci sono nel sessionStorage
    }
  }

  private handleCantiereFilter(){
    this.tableService.filterTableByCantiere$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (cantieri: string[])=>{
        this.vehicleTableData.data = this.tableService.filterTableByCantieri(this.allVehicles, cantieri) as any;
        this.loadGraphs(this.vehicleTableData.data);
      },
      error: error => console.error("Errore nella ricezione del filtro per la tabella: ", error)
    });
  }

  private handlErrorGraphClick(){
    //riempe tabella con i dati senza filtri
    this.checkErrorsService.fillTable$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicles: any[]) => {
        this.fillTableWithGraph(vehicles);
        this.blackboxGraphService.loadChartData(vehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error)
    });

    //riempre la tabella con solo veicoli funzionanti
    this.errorGraphService.loadFunzionanteData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (workingVehicles: any[]) => {
        this.fillTableWithGraph(workingVehicles);
        this.blackboxGraphService.loadChartData(workingVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error)
    });

    //riempre la tabella con solo veicoli che presentano warning
    this.errorGraphService.loadWarningData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (warningVehicles: any[]) => {
        this.fillTableWithGraph(warningVehicles);
        this.blackboxGraphService.loadChartData(warningVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error)
    });

    //riempre la tabella con solo veicoli che presentano errori
    this.errorGraphService.loadErrorData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (errorVehicles: any[]) => {
        this.fillTableWithGraph(errorVehicles);
        this.blackboxGraphService.loadChartData(errorVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico degli errori: ", error)
    });
  }

  private handleBlackBoxGraphClick(){
    this.blackboxGraphService.loadBlackBoxData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (blackBoxVehicles: any[]) => {
        this.fillTableWithGraph(blackBoxVehicles);
        this.errorGraphService.loadChartData(blackBoxVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico dei blackbox: ", error)
    });
    this.blackboxGraphService.loadBlackBoxAntennaData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (blackBoxAntennaVehicles: any[]) => {
        this.fillTableWithGraph(blackBoxAntennaVehicles);
        this.errorGraphService.loadChartData(blackBoxAntennaVehicles);
      },
      error: error => console.error("Errore nel caricamento dei dati dal grafico dei blackbox: ", error)
    });
  }


  onSortChange(event: Sort){
    console.log("Nome colonna: ", event.active);
    console.log("Direzione: ", event.direction);
  }

  /**
 * Riempe la tabella con i dati dei veicoli
 */
  fillTable() {
    console.log("CHIAMATO FILL TABLE!");

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

            //Accorpamento anomalie di sessione
            vehicles.forEach(v => {
              v.anomalySessions = anomaliesVehicles
                .filter(anomalyVehicle => anomalyVehicle.veId === v.veId && anomalyVehicle.sessions?.length > 0)
                .flatMap(anomalyVehicle => anomalyVehicle.sessions);

              //Accorpamento ultima sessione valida
              v.lastValidSession = lastValidSessions
                .find(lastSession => lastSession.veId === v.veId).lastValidSession || null; // Assign `null` if no session is found.
            });

            // Aggiornamento tabella
            this.vehicleTableData.data = [...this.vehicleTableData.data, ...vehicles];
            this.vehicleTable.renderRows();

          }


          sessionStorage.setItem("allVehicles", JSON.stringify(vehicles));// Inserimento veicoli in sessionstorage
          this.loadGraphs(vehicles);// Carica i grafici dopo il caricamento della tabella
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
