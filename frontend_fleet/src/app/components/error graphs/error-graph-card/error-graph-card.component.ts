import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ErrorBarGraphComponent } from "../error-bar-graph/error-bar-graph.component";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ErrorPieGraphComponent } from '../error-pie-graph/error-pie-graph.component';

@Component({
  selector: 'app-error-graph-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    ErrorBarGraphComponent,
    ErrorPieGraphComponent,
    MatSelectModule,
    MatOptionModule
],
  templateUrl: './error-graph-card.component.html',
  styleUrl: './error-graph-card.component.css'
})
export class ErrorGraphCardComponent implements AfterViewInit{
  @ViewChild('graphSelect') graphSelect!: MatSelect;
  pieGraph: boolean = true;
  barGraph: boolean = false;

  constructor(
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
    this.graphSelect.value = 'pie';
  }

  changeGraph(graph: string): void {
    console.log(graph);
    switch (graph) {
      case 'pie':
        this.barGraph = false;
        this.pieGraph = true;
        break;
      case 'bar':
        this.pieGraph = false;
        this.barGraph = true;
        break;
    }
    this.cd.detectChanges();
  }


}
