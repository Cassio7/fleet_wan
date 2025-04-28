import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, effect, ElementRef, inject, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { skip, Subject, takeUntil } from 'rxjs';
import { MapComponent } from '../../../Common-components/map/map.component';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { LoginService } from '../../../Common-services/login service/login.service';
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeData } from '../../../Common-services/realtime-api/realtime-api.service';
import { openSnackbar } from '../../../Utils/snackbar';
import { DashboardService } from '../../Services/dashboard/dashboard.service';
import { ErrorGraphsService } from '../../Services/error-graphs/error-graphs.service';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { KanbanSessioneService } from '../../Services/kanban-sessione/kanban-sessione.service';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';
import { ErrorGraphCardComponent } from '../error-graphs/error-graph-card/error-graph-card.component';
import { KanbanAntennaComponent } from "../kanban-antenna/kanban-antenna.component";
import { KanbanGpsComponent } from "../kanban-gps/kanban-gps.component";
import { KanbanSessioneComponent } from "../kanban-sessione/kanban-sessione.component";
import { KebabMenuComponent } from '../kebab-menu/kebab-menu.component';
import { RowFilterComponent } from '../row-filter/row-filter.component';
import { TableComponent } from '../table/table.component';
import { SessionStorageService } from './../../../Common-services/sessionStorage/session-storage.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatNativeDateModule,
    MatDatepickerModule,
    RouterModule,
    MatButtonModule,
    MatToolbarModule,
    TableComponent,
    ErrorGraphCardComponent,
    KebabMenuComponent,
    KanbanGpsComponent,
    MatSlideToggleModule,
    KanbanAntennaComponent,
    MapComponent,
    MatSnackBarModule,
    KanbanSessioneComponent,
    RowFilterComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy{
  @ViewChild('mapContainer', { static: true }) mapContainerRef!: ElementRef;
  @ViewChild('graphs') graphs!: ElementRef;
  private readonly destroy$: Subject<void> = new Subject<void>();

  errorGraphTitle: string = "GPS";

  todayDate: Date = new Date;
  dashboard = false;
  today = true;
  lastSession = false;
  switchText: string = "Oggi";

  pageName = "Riepilogo";
  subtitle = "Monitora i tuoi veicoli";

  mapVehiclePlate: string = "";

  private snackbar = inject(MatSnackBar);
  private snackbarDuration = 2;

  private _table: boolean = true;
  private _kanbanGps: boolean = false;
  private _kanbanAntenna: boolean = false;
  private _kanbanSessione: boolean = false;

  private resizeObserver!: ResizeObserver;
  lastUpdate: string = "";

  constructor(
    private kabanGpsService: KanbanGpsService,
    private errorGraphService: ErrorGraphsService,
    private dashboardService: DashboardService,
    private mapService: MapService,
    private KanbanAntennaService: KanbanAntennaService,
    private kanbanTableService: KanbanTableService,
    private kanbanSessionService: KanbanSessioneService,
    private checkErrorsService: CheckErrorsService,
    private loginService: LoginService,
    private sessionStorageService: SessionStorageService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ){
    effect(() => {
      const signalLastUpate = this.dashboardService.lastUpdate();

      if(signalLastUpate){
        this.lastUpdate = signalLastUpate;
      }else{
        this.lastUpdate = sessionStorageService.getItem("lastUpdate");
      }
      console.log('lastupdate: ', this.lastUpdate);
      this.verifyCheckDay(this.lastUpdate);
      this.cd.detectChanges();
    });
  }
  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    const currentSection = this.sessionStorageService.getItem("dashboard-section");
    this.displaySection(currentSection);
  }

  ngAfterViewInit(): void {
    this.errorGraphTitle = this.errorGraphService.graphTitle;

    this.handleKanbanLoading();

    if(this.today){
      this.handleMapResizing();
    }

    this.handleLogin();

    this.handleLoadPosition();

    this.handleTableLoaded();

    this.mapService.initMap$.next({point: this.mapService.defaultPoint, zoom: this.mapService.defaultZoom});

    this.cd.detectChanges();
  }

  /**
   * Controlla se prima del refresh della pagina, i dati della dashboard
   * erano impostati ad oggi o all'ultimo andamento.
   * Imposta lo stile dei bottoni "Oggi" e "Recente"
   */
  private verifyCheckDay(lastUpdate: string){
    if(lastUpdate){
      if (lastUpdate != "recente") {
        this.today = true;
        this.lastSession = false;
        this.lastUpdate = lastUpdate;
      } else {
        this.today = false;
        this.lastSession = true;
      }
    }else{
      this.today = false;
      this.lastSession = true;
    }

    this.cd.detectChanges();
  }


  /**
   * Ascolta per il caricamento di uno dei kanban per mostrare la sezione associata con i corrispettivi dati
   */
  private handleKanbanLoading(){
    this.kanbanTableService.loadKabanTable$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.dashboard = true;
        this.displaySection("table"); //display del componente scelto dal kebab menu
        this.pageName = "Riepilogo";
        this.subtitle = "Monitora i tuoi veicoli";
        this.errorGraphTitle = this.errorGraphService.graphTitle = "Errors";//impostazione titolo del grafico
        this.sessionStorageService.setItem("dashboard-section", "table");
      },
      error: error => console.error("Errore nel caricamento del kaban gps: ", error)
    });
    this.kabanGpsService.loadKanbanGps$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.displaySection("GPS"); //display del componente scelto dal kebab menu
        this.pageName = "GPS";
        this.subtitle = "Monitora lo stato dei GPS";
        this.errorGraphTitle = this.errorGraphService.graphTitle = "GPS";//impostazione titolo del grafico
        this.sessionStorageService.setItem("dashboard-section", "GPS");
      },
      error: error => console.error("Errore nel caricamento del kaban gps: ", error)
    });
    this.KanbanAntennaService.loadKanbanAntenna$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.displaySection("Antenna"); //display del componente scelto dal kebab menu
        this.pageName = "Antenna";
        this.subtitle = "Monitora lo stato delle antenne";
        this.errorGraphTitle = this.errorGraphService.graphTitle = "Antenna";
        this.sessionStorageService.setItem("dashboard-section", "Antenna");
      },
      error: error => console.error("Errore nel caricamento del kaban gps: ", error)
    });
    this.kanbanSessionService.loadKanbanSessione$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.displaySection("sessione"); //display del componente scelto dal kebab menu
        this.pageName = "Sessione";
        this.subtitle = "Monitora lo stato della sessione";
        this.cd.detectChanges();
        // this.errorGraphTitle = this.errorGraphService.graphTitle = "Sessione";
        this.sessionStorageService.setItem("dashboard-section", "Sessione");
      },
      error: error => console.error("Errore nel caricamento del kaban gps: ", error)
    });
  }

  /**
   * Mostra una sezione della dashboard
   * @param sectionName nome della sezione da mostrare
   */
  private displaySection(sectionName: string){
    switch(sectionName){
      case "table":
        this.pageName = "Riepilogo";
        this.subtitle = "Monitora i tuoi veicoli";
        this.table = true;
        this.kanbanGps = false;
        this.kabanAntenna = false;
        this.kanbanSessione = false;
        break;
      case "GPS":
        this.pageName = "GPS";
        this.subtitle = "Monitora lo stato dei GPS";
        this.kanbanGps = true;
        this.table = false;
        this.kabanAntenna = false;
        this.kanbanSessione = false;
        break;
      case "Antenna":
        this.pageName = "Antenna";
        this.subtitle = "Monitora lo stato delle antenne";
        this.kabanAntenna = true;
        this.table = false;
        this.kanbanGps = false;
        this.kanbanSessione = false;
        break;
      case "sessione":
        this.pageName = "Sessione";
        this.subtitle = "Monitora lo stato della sessione";
        this.kanbanSessione = true;
        this.table = false;
        this.kanbanGps = false;
        this.kabanAntenna = false;
    }
  }

  /**
   * Notifica di passare dai dati di oggi a quelli dell'ultimo andamento o viceversa
   * @param event evento toggle
   */
  dataSwitch(){
    if(!this.today){
      this.today = true;
      this.lastSession = false;
      this.switchText = "Oggi";
      this.mapVehiclePlate = "";
      this.checkErrorsService.switchCheckDay$.next("today");
      setTimeout(() => {
        this.mapService.initMap$.next({point: this.mapService.defaultPoint, zoom: this.mapService.defaultZoom});
      });
    }else{
      this.today = false;
      this.lastSession = true;
      this.switchText = "Ultimo andamento"
      this.checkErrorsService.switchCheckDay$.next("last");
      this.mapVehiclePlate = "";
      this.sessionStorageService.setItem("lastUpdate", "recente");
    }
  }

  /**
   * Aggiorna i dati di oggi
   */
  updateData(){
    this.lastUpdate = "Calcolo...";
    this.checkErrorsService.updateAnomalies().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.checkErrorsService.updateAnomalies$.next();
      },
      error: error => console.error("Errore nell'aggiornamento delle anomalie: ", error)
    });
  }

  /**
   * Verifica se una stringa rappresenta una data valida.
   * @param stringa - La stringa da controllare.
   * @returns true se la stringa è una data valida
   * @returns false se la stringa non è una data valida
   */
  checkDate(stringa: string): boolean {
    const data = new Date(stringa);
    return !isNaN(data.getTime());
  }

  /**
   * Ascolta il completamento del caricamento della tabella
   */
  private handleTableLoaded(){
    this.kanbanTableService.tableLoaded$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        openSnackbar(this.snackbar, "Dati aggiornati con successo! ✔");
      },
      error: error => console.error("Errore nella notifica di caricamento della tabella: ", error)
    });
  }

  /**
   * Ascolta il ridimensionamento del contenitore della mappa per ricalcolare le dimensioni di quest'ultima di conseguenza
   */
  private handleMapResizing(){
    if(this.mapContainerRef){
      const mapDiv = this.mapContainerRef.nativeElement;
      this.ngZone.runOutsideAngular(() => {
        this.resizeObserver = new ResizeObserver(() => {
          this.mapService.resizeMap$.next();
        });
        this.resizeObserver.observe(mapDiv);
      });
    }
  }

  /**
   * Ascolta il subject che notifica il login di un utente
   */
  private handleLogin(){
    this.loginService.login$.pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.today = true;
      this.lastSession = false;
      this.checkErrorsService.switchCheckDay$.next("today");
    });
  }

  /**
   * Ascolta il subject per il caricamento delle posizioni sulla mappa
   */
  private handleLoadPosition(){
    this.mapService.loadPosition$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (realtimeData: RealtimeData | null) => {
        this.mapVehiclePlate = realtimeData?.vehicle.plate || "";
      },
      error: error => console.error("Errore nella ricezione del caricamento di un posizione: ", error)
    });
  }

  public get table(): boolean {
    return this._table;
  }
  public set table(value: boolean) {
    this._table = value;
  }
  public get kanbanGps(): boolean {
    return this._kanbanGps;
  }
  public set kanbanGps(value: boolean) {
    this._kanbanGps = value;
  }
  public get kabanAntenna(): boolean {
    return this._kanbanAntenna;
  }
  public set kabanAntenna(value: boolean) {
    this._kanbanAntenna = value;
  }
  public get kanbanSessione(): boolean {
    return this._kanbanSessione;
  }
  public set kanbanSessione(value: boolean) {
    this._kanbanSessione = value;
  }
}
