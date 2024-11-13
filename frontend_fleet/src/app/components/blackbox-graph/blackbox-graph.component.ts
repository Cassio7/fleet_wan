import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive, ApexTheme, ApexTitleSubtitle, ChartComponent, NgApexchartsModule } from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  theme: ApexTheme;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-blackbox-graph',
  standalone: true,
  imports: [
    NgApexchartsModule,
    MatCardModule
  ],
  templateUrl: './blackbox-graph.component.html',
  styleUrl: './blackbox-graph.component.css',
  encapsulation: ViewEncapsulation.None
})

export class BlackboxGraphComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor() {
    this.chartOptions = {
      series: [60, 40],
      chart: {
        type: "pie"
      },
      labels: ["Blackbox", "BlackBox+antenna"],
      theme: {
        monochrome: {
          enabled: true
        }
      },
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
