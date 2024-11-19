import { ErrorGraphsService } from '../../../Services/error-graphs-service/error-graphs.service';
import { MatCardModule } from '@angular/material/card';
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive, ChartComponent, NgApexchartsModule } from "ng-apexcharts";

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

export class ErrorPieGraphComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor(
    private errorGraphsService: ErrorGraphsService
  ) {
    this.chartOptions = {
      series: this.errorGraphsService.values,
      chart: {
        type: "pie",
        height: "400",
        width: "100%"
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
}
