import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { BlackboxGraphCardComponent } from '../blackbox-graphs/blackbox-graph-card/blackbox-graph-card.component';
import { ErrorGraphCardComponent } from '../error graphs/error-graph-card/error-graph-card.component';
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
    BlackboxGraphCardComponent,
    RowFilterComponent,
    KebabMenuComponent,
    KanbanGpsComponent,
    KanbanAntennaComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  private _table: boolean = true;
  private _kanbanGps: boolean = false;
  private _kanbanAntenna: boolean = false;


  constructor(
    private kabanGpsService: KanbanGpsService,
    private KanbanAntennaService: KanbanAntennaService,
    private kanbanTableService: KanbanTableService,
    private cd: ChangeDetectorRef
  ){

  }
  ngAfterViewInit(): void {
    this.kanbanTableService.loadKabanTable$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.displayComponent("table"); //display del componente scelto dal kebab menu
      },
      error: error => console.error("Errore nel caricamento del kaban gps: ", error)
    });
    this.kabanGpsService.loadKanbanGps$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.displayComponent("GPS"); //display del componente scelto dal kebab menu
      },
      error: error => console.error("Errore nel caricamento del kaban gps: ", error)
    });
    this.KanbanAntennaService.loadKanbanAntenna$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.displayComponent("antenna"); //display del componente scelto dal kebab menu
      },
      error: error => console.error("Errore nel caricamento del kaban gps: ", error)
    });

  }

  private displayComponent(pageName: string){
    switch(pageName){
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
      case "antenna":
        this.kabanAntenna = true;
        this.table = false;
        this.kanbanGps = false;
    }
    this.cd.detectChanges();
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
