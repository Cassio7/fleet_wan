import { SessionStorageService } from './../../../Common-services/sessionStorage/session-storage.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild, OnInit, inject, OnDestroy, effect } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { ErrorGraphCardComponent } from '../error-graphs/error-graph-card/error-graph-card.component';
import { TableComponent } from '../table/table.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RowFilterComponent } from '../row-filter/row-filter.component';
import { KebabMenuComponent } from '../kebab-menu/kebab-menu.component';
import { last, skip, Subject, takeUntil } from 'rxjs';
import { KanbanGpsComponent } from "../kanban-gps/kanban-gps.component";
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { KanbanAntennaComponent } from "../kanban-antenna/kanban-antenna.component";
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';
import { ErrorGraphsService } from '../../Services/error-graphs/error-graphs.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { MapComponent } from '../../../Common-components/map/map.component';
import { KanbanSessioneComponent } from "../kanban-sessione/kanban-sessione.component";
import { KanbanSessioneService } from '../../Services/kanban-sessione/kanban-sessione.service';
import { LoginService } from '../../../Common-services/login service/login.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../../../Common-components/snackbar/snackbar.component';
import { MapService } from '../../../Common-services/map/map.service';
import { RealtimeData } from '../../../Models/RealtimeData';
import { DashboardService } from '../../Services/dashboard/dashboard.service';


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
    private cd: ChangeDetectorRef
  ){
    effect(() => {
      this.lastUpdate = this.dashboardService.lastUpdate();
      this.openSnackbar("Dati aggiornati con successo! ✔");
      this.cd.detectChanges();
    });
  }
  ngOnDestroy(): void {
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

    this.loginService.login$.pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.today = true;
      this.lastSession = false;
      this.checkErrorsService.switchCheckDay$.next("today");
    });

    setTimeout(() => {
      this.verifyCheckDay();
    });

    this.mapService.loadPosition$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (realtimeData: RealtimeData | null) => {
        this.mapVehiclePlate = realtimeData?.vehicle.plate || "";
      },
      error: error => console.error("Errore nella ricezione del caricamento di un posizione: ", error)
    });

    this.mapService.initMap$.next({point: this.mapService.defaultPoint, zoom: this.mapService.defaultZoom});

    this.cd.detectChanges();
  }

  /**
   * Controlla se prima del refresh della pagina, i dati della dashboard
   * erano impostati ad oggi o all'ultimo andamento
   */
  private verifyCheckDay(){
    const lastUpdate = this.sessionStorageService.getItem("lastUpdate");
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

  checkDate(stringa: string): boolean {
    const data = new Date(stringa);
    return !isNaN(data.getTime());
  }

  /**
   * Apre la snackbar
   * @param content stringa contenuto della snackbar
   */
  openSnackbar(content: string): void {
    this.snackbar.openFromComponent(SnackbarComponent, {
      duration: this.snackbarDuration * 1000,
      data: { content: content }
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
