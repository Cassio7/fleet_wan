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
    KanbanGpsComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  private _table: boolean = true;
  private _kabanGps: boolean = false;

  constructor(
    private kabanGpsService: KanbanGpsService,
    private cd: ChangeDetectorRef
  ){

  }
  ngAfterViewInit(): void {
    this.kabanGpsService.loadKanbanGps$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (option: string) => {
        this.displayComponent(option); //display del componente scelto dal kebab menu
      },
      error: error => console.error("Errore nel caricamento del kaban gps: ", error)
    });
  }

  private displayComponent(pageName: string){
    switch(pageName){
      case "table":
        this.table = true;
        this.kabanGps = false;
        break;
      case "GPS":
        this.kabanGps = true;
        this.table = false;
        break;
    }
    this.cd.detectChanges();
  }

  public get table(): boolean {
    return this._table;
  }
  public set table(value: boolean) {
    this._table = value;
  }
  public get kabanGps(): boolean {
    return this._kabanGps;
  }
  public set kabanGps(value: boolean) {
    this._kabanGps = value;
  }
}
