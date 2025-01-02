import { ErrorGraphsService } from '../../../Services/error-graphs/error-graphs.service';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ErrorPieGraphComponent } from '../error-pie-graph/error-pie-graph.component';
import { first, skip, Subject, take, takeUntil } from 'rxjs';
import { GpsGraphComponent } from "../gps-graph/gps-graph.component";
import { KanbanGpsService } from '../../../Services/kanban-gps/kanban-gps.service';
import { KanbanAntennaService } from '../../../Services/kanban-antenna/kanban-antenna.service';
import { KanbanTableService } from '../../../Services/kanban-table/kanban-table.service';

@Component({
  selector: 'app-error-graph-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ErrorPieGraphComponent,
    MatSelectModule,
    MatOptionModule,
    GpsGraphComponent
],
  templateUrl: './error-graph-card.component.html',
  styleUrl: './error-graph-card.component.css'
})
export class ErrorGraphCardComponent implements AfterViewInit, OnDestroy{
  private destroy$: Subject<void> = new Subject<void>();
  errorGraphTitle: string = "Errors";
  errorsGraph: boolean = true;
  gpsGraph: boolean = false;
  antennaGraph: boolean = false;

  constructor(
    private kanabanGpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService,
    private kanbanTableService: KanbanTableService,
    private cd: ChangeDetectorRef
  ){}


  ngAfterViewInit(): void {
    console.log("load kanban table");
    this.errorGraphTitle = "Errors";
    this.changeGraph('Errors');
    this.cd.detectChanges();

    this.kanabanGpsService.loadKanbanGps$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        console.log("load kanban gps");
        this.errorGraphTitle = "GPS";
        this.changeGraph('GPS');
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel cambio del grafico: ", error)
    });
    this.kanbanAntennaService.loadKanbanAntenna$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        console.log("load kanban Antenna");
        this.errorGraphTitle = "Antenna";
        this.changeGraph('Antenna');
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel cambio del grafico: ", error)
    });
    this.kanbanTableService.loadKabanTable$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        console.log("load kanban table");
        this.errorGraphTitle = "Errors";
        this.changeGraph('Errors');
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel cambio del grafico: ", error)
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeGraph(graph: string): void {
    switch (graph) {
      case 'Errors':
        this.errorsGraph = true;
        this.gpsGraph = false;
        this.antennaGraph = false;
        break;
      case 'GPS':
        this.errorsGraph = false;
        this.antennaGraph = false;
        this.gpsGraph = true;
        break;
      case 'Antenna':
        this.errorsGraph = false;
        this.antennaGraph = true;
        this.gpsGraph = false;
        break;
    }
    this.cd.detectChanges();
  }


}
