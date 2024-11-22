import { ErrorGraphsService } from '../../../Services/error-graphs/error-graphs.service';
import { MatCardModule } from '@angular/material/card';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive, ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { skip, Subject, takeUntil } from 'rxjs';
import { VehiclesApiService } from '../../../Services/vehicles/vehicles-api.service';

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
    this.chartOptions.series = this.errorGraphsService.loadGraphData$.value;
    this.errorGraphsService.loadGraphData$.pipe(skip(1),takeUntil(this.destroy$))
    .subscribe({
      next: (series: any[]) => {
        this.chartOptions.series = series;
        this.cd.detectChanges();
      },
      error: error => console.error(error)
    });
  }
}
