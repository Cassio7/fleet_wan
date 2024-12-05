import { ErrorGraphsService } from '../../../Services/error-graphs/error-graphs.service';
import { MatCardModule } from '@angular/material/card';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive, ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { skip, Subject, takeUntil } from 'rxjs';
import { VehiclesApiService } from '../../../../Common-services/vehicles service/vehicles-api.service';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { Vehicle } from '../../../../Models/Vehicle';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  colors?: string[];
};


@Component({
  selector: 'app-pie-error-graph',
  standalone: true,
  imports: [
    NgApexchartsModule,
    MatCardModule
  ],
  templateUrl: './error-pie-graph.component.html',
  styleUrl: './error-pie-graph.component.css',
  encapsulation: ViewEncapsulation.None
})

export class ErrorPieGraphComponent implements AfterViewInit, OnDestroy{
  @ViewChild("chart") chart!: ChartComponent;
  private readonly destroy$: Subject<void> = new Subject<void>();
  public chartOptions: Partial<ChartOptions>;

  constructor(
    private errorGraphsService: ErrorGraphsService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ) {
    this.chartOptions = {
      series: [],
      chart: {
        type: "pie",
        height: "400",
        width: "100%",
        events: {
          dataPointSelection: (event, chartContext, config) => {
            switch (config.dataPointIndex) {
              case 0:
                this.workingClick();
                break;
              case 1:
                this.warningClick();
                break;
              case 2:
                this.errorClick();
                break;
            }
          }
        }
      },
      labels: ["Funzionante", "Warning", "Error"],
      colors: this.errorGraphsService.colors,
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: "top"
            },
            chart: {
              height: "300"
            }
          }
        }
      ]
    };
  }

  workingClick() {
    this.errorGraphsService.workingClick();
  }

  warningClick() {
    this.errorGraphsService.warningClick();
  }

  errorClick() {
    this.errorGraphsService.errorClick();
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // if(this.sessionStorageService.getItem("errorSlice")){
    //   const errorSlice = this.sessionStorageService.getItem("errorSlice")
    //   switch (errorSlice) {
    //     case "working":
    //       this.errorGraphsService.errorsData.errorSliceSelected = "working";
    //       this.workingClick();
    //       break;

    //     case "warning":
    //       this.errorGraphsService.errorsData.errorSliceSelected = "warning";
    //       this.warningClick();
    //       break;

    //     case "error":
    //       this.errorGraphsService.errorsData.errorSliceSelected = "error";
    //       this.errorClick();
    //       break;
    //   }
    // }
    this.chartOptions.series = this.errorGraphsService.loadGraphData$.value;
    this.errorGraphsService.loadGraphData$.pipe(skip(1),takeUntil(this.destroy$))
    .subscribe({
      next: (series: any[]) => {
        this.chartOptions.series = series;
        if(this.chart){
          this.chart.highlightSeries("Funzionante");
        }
        this.cd.detectChanges();
      },
      error: error => console.error(error)
    });
  }
}
