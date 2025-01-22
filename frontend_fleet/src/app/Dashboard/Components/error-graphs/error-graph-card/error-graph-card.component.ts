import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ErrorPieGraphComponent } from '../error-pie-graph/error-pie-graph.component';
import { Subject } from 'rxjs';
import { GpsGraphComponent } from "../gps-graph/gps-graph.component";
import { KanbanGpsService } from '../../../Services/kanban-gps/kanban-gps.service';
import { KanbanAntennaService } from '../../../Services/kanban-antenna/kanban-antenna.service';
import { KanbanTableService } from '../../../Services/kanban-table/kanban-table.service';
import { AntennaGraphComponent } from "../antenna-graph/antenna-graph.component";

@Component({
  selector: 'app-error-graph-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ErrorPieGraphComponent,
    MatSelectModule,
    MatOptionModule,
    GpsGraphComponent,
    AntennaGraphComponent
],
  templateUrl: './error-graph-card.component.html',
  styleUrl: './error-graph-card.component.css'
})
export class ErrorGraphCardComponent implements AfterViewInit, OnDestroy{
  private destroy$: Subject<void> = new Subject<void>();
  @Input() errorGraphTitle!: string;

  errorsGraph: boolean = false;
  gpsGraph: boolean = false;
  antennaGraph: boolean = false;

  constructor(
    private kanabanGpsService: KanbanGpsService,
    private kanbanAntennaService: KanbanAntennaService,
    private kanbanTableService: KanbanTableService,
    private cd: ChangeDetectorRef
  ){}


  ngAfterViewInit(){
    this.changeGraph(this.errorGraphTitle);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeGraph(graph: string): void {
    switch (graph) {
      case 'Errors':
        this.errorGraphTitle = "Errors";
        this.errorsGraph = true;
        this.gpsGraph = false;
        this.antennaGraph = false;
        break;
      case 'GPS':
        this.errorGraphTitle = "GPS";
        this.errorsGraph = false;
        this.antennaGraph = false;
        this.gpsGraph = true;
        break;
      case 'Antenna':
        this.errorGraphTitle = "Antenna";
        this.errorsGraph = false;
        this.antennaGraph = true;
        this.gpsGraph = false;
        break;
    }
    this.cd.detectChanges();
  }


}
