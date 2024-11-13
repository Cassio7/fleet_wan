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
  selector: 'app-error-graph',
  standalone: true,
  imports: [
    NgApexchartsModule,
    MatCardModule
  ],
  templateUrl: './error-graph.component.html',
  styleUrl: './error-graph.component.css',
  encapsulation: ViewEncapsulation.None
})

export class ErrorGraphComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [44, 55, 13],
      chart: {
        type: "pie"
      },
      labels: ["Funzionante", "Warning", "Error"],
      colors: ["#28a745", "#ffc107", "#dc3545"],
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: "top"
            }
          }
        }
      ]
    };

  }
}
