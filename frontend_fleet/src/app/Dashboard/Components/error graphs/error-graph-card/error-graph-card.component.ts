import { ErrorGraphsService } from './../../../Services/error-graphs/error-graphs.service';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ErrorBarGraphComponent } from "../error-bar-graph/error-bar-graph.component";
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ErrorPieGraphComponent } from '../error-pie-graph/error-pie-graph.component';
import { first, skip, Subject, takeUntil } from 'rxjs';

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
export class ErrorGraphCardComponent implements AfterViewInit, OnDestroy{
  @ViewChild('graphSelect') graphSelect!: MatSelect;
  private destroy$: Subject<void> = new Subject<void>();
  private _series: number[] = [];
  pieGraph: boolean = true;
  barGraph: boolean = false;

  constructor(
    private errorGraphsService: ErrorGraphsService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    setTimeout(()=>{
      if(this.graphSelect){
        this.graphSelect.value = 'pie';
      }
    });
    this.cd.detectChanges();
  }

  changeGraph(graph: string): void {
    switch (graph) {
      case 'pie':
        this.graphSelect.value = 'pie';
        this.barGraph = false;
        this.pieGraph = true;
        break;
      case 'bar':
        this.graphSelect.value = 'bar';
        this.pieGraph = false;
        this.barGraph = true;
        break;
      // default:
      //   switch(this.errorGraphsService.errorSliceSelected){
      //     case "working":
      //       this.errorGraphsService.check();
      //       break;
      //     case "warning":
      //       break;
      //     case "errors":
      //       break;
      //   }
    }
    this.cd.detectChanges();
  }


}
