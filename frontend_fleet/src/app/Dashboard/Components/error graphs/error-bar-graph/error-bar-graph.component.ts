import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexGrid, ApexLegend, ApexPlotOptions, ApexYAxis, ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { ErrorGraphsService } from '../../../Services/error-graphs/error-graphs.service';
import { Subject, takeUntil } from 'rxjs';

type ApexXAxis = {
  type?: "category" | "datetime" | "numeric";
  categories?: any;
  labels?: {
    style?: {
      colors?: string | string[];
      fontSize?: string;
    };
  };
};

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  grid: ApexGrid;
  colors: string[];
  legend: ApexLegend;
};

@Component({
  selector: 'app-error-bar-graph',
  standalone: true,
  imports: [
    NgApexchartsModule
  ],
  templateUrl: './error-bar-graph.component.html',
  styleUrl: './error-bar-graph.component.css'
})
export class ErrorBarGraphComponent implements AfterViewInit, OnDestroy{
  @ViewChild("chart") chart!: ChartComponent;
  private readonly destroy$: Subject<void> = new Subject<void>();
  public chartOptions: Partial<ChartOptions>;

  constructor(
    private errorGraphsService: ErrorGraphsService
  ) {
    this.chartOptions = {
      series: [
        {
          name: "Data",
          data: this.errorGraphsService.series
        }
      ],
      chart: {
        type: "bar",
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
      colors: this.errorGraphsService.colors,
      plotOptions: {
        bar: {
          columnWidth: "45%",
          distributed: true
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false
      },
      grid: {
        show: false
      },
      xaxis: {
        categories: ["Funzionante", "Warning", "Error"],
        labels: {
          style: {
            colors: this.errorGraphsService.colors,
            fontSize: "12px"
          }
        }
      }
    };
  }

  workingClick() {
    this.errorGraphsService.workingClick();
  }

  warningClick(){
    this.errorGraphsService.warningClick();
  }

  errorClick(){
    this.errorGraphsService.errorClick();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.chartOptions.series = [{
      name: "Data",
      data: this.errorGraphsService.loadGraphData$.value
    }];
    this.errorGraphsService.loadGraphData$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (series: number[]) => {
        this.chartOptions.series = [{
          name: "Data",
          data: series
        }];
      },
      error: error => console.error(error)
    });
  }
}
