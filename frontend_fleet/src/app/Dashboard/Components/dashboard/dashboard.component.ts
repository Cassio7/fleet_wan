import { SessionStorageService } from './../../../Common-services/sessionStorage/session-storage.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { BlackboxGraphCardComponent } from '../blackbox-graphs/blackbox-graph-card/blackbox-graph-card.component';
import { ErrorGraphCardComponent } from '../error-graphs/error-graph-card/error-graph-card.component';
import { TableComponent } from '../table/table.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RowFilterComponent } from '../row-filter/row-filter.component';
import { KebabMenuComponent } from '../kebab-menu/kebab-menu.component';
import { skip, Subject, takeUntil } from 'rxjs';
import { KanbanGpsComponent } from "../kanban-gps/kanban-gps.component";
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { KanbanAntennaComponent } from "../kanban-antenna/kanban-antenna.component";
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { KanbanTableService } from '../../Services/kanban-table/kanban-table.service';
import { ErrorGraphsService } from '../../Services/error-graphs/error-graphs.service';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { KanbanFiltersComponent } from "../kanban-filters/kanban-filters.component";
import { MapComponent } from '../../../Common-components/map/map.component';


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
    RowFilterComponent,
    KebabMenuComponent,
    KanbanGpsComponent,
    MatSlideToggleModule,
    KanbanAntennaComponent,
    MapComponent,
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit{
  @ViewChild('graphs') graphs!: ElementRef;
  private readonly destroy$: Subject<void> = new Subject<void>();

  errorGraphTitle: string = "GPS";

  todayDate: Date = new Date;
  dashboard = false;
  today = true;
  lastSession = false;
  switchText: string = "Oggi";

  pageName = "Riepilogo parco mezzi";
  subtitle = "Monitora i tuoi veicoli";

  private _table: boolean = true;
  private _kanbanGps: boolean = false;
  private _kanbanAntenna: boolean = false;


  constructor(
    private kabanGpsService: KanbanGpsService,
    private errorGraphService: ErrorGraphsService,
    private KanbanAntennaService: KanbanAntennaService,
    private kanbanTableService: KanbanTableService,
    private checkErrorsService: CheckErrorsService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){

  }

  ngAfterViewInit(): void {
    this.errorGraphTitle = this.errorGraphService.graphTitle;
    const currentSection = this.sessionStorageService.getItem("dashboard-section");
    this.displaySection(currentSection);

    this.handleKanbanLoading();
    this.cd.detectChanges();
  }

  private handleKanbanLoading(){
    this.kanbanTableService.loadKabanTable$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.dashboard = true;
        this.displaySection("table"); //display del componente scelto dal kebab menu
        this.pageName = "Riepilogo parco mezzi";
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
  }

  /**
   * Mostra una sezione della dashboard
   * @param sectionName nome della sezione da mostrare
   */
  private displaySection(sectionName: string){
    switch(sectionName){
      case "table":
        this.table = true;
        this.kanbanGps = false;
        this.kabanAntenna = false;
        break;
      case "GPS":
        this.kanbanGps = true;
        this.table = false;
        this.kabanAntenna = false;
        break;
      case "Antenna":
        this.kabanAntenna = true;
        this.table = false;
        this.kanbanGps = false;
        break;
    }

    this.cd.detectChanges();
  }

  /**
   * Notifica di passare dai dati di oggi a quelli dell'ultimo andamento o viceversa
   * @param event evento toggle
   */
  dataSwitch(event: MatSlideToggleChange){
    if(event.checked){
      this.today = true;
      this.lastSession = false;
      this.switchText = "Oggi";
      this.checkErrorsService.switchCheckDay$.next("today");
    }else{
      this.today = false;
      this.lastSession = true;
      this.switchText = "Ultimo andamento"
      this.checkErrorsService.switchCheckDay$.next("last");
    }
  }

  /**
   * Aggiorna i dati di oggi
   */
  updateData(){
    this.checkErrorsService.updateAnomalies().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.checkErrorsService.updateAnomalies$.next();
      },
      error: error => console.error("Errore nell'aggiornamento delle anomalie: ", error)
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
}
