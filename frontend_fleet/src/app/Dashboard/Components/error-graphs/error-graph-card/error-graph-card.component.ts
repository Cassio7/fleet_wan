import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { AntennaGraphComponent } from "../antenna-graph/antenna-graph.component";
import { ErrorPieGraphComponent } from '../error-pie-graph/error-pie-graph.component';
import { GpsGraphComponent } from "../gps-graph/gps-graph.component";
import { SessioneGraphComponent } from "../sessione-graph/sessione-graph.component";

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
    AntennaGraphComponent,
    SessioneGraphComponent
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
  sessioneGraph: boolean = false;

  constructor(
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
        this.sessioneGraph = false;
        break;
      case 'GPS':
        this.errorGraphTitle = "GPS";
        this.errorsGraph = false;
        this.antennaGraph = false;
        this.gpsGraph = true;
        this.sessioneGraph = false;
        break;
      case 'Antenna':
        this.errorGraphTitle = "Antenna";
        this.errorsGraph = false;
        this.antennaGraph = true;
        this.gpsGraph = false;
        this.sessioneGraph = false;
        break;
      case 'Sessione':
        this.errorGraphTitle = "Sessione";
        this.errorsGraph = false;
        this.antennaGraph = false;
        this.gpsGraph = false;
        this.sessioneGraph = true;
    }
    this.cd.detectChanges();
  }


}
