import { Component, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexTheme, ApexTitleSubtitle, NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { BlackboxGraphsService } from '../../../services/blackbox-graphs/blackbox-graphs.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  theme: ApexTheme;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-blackbox-pie-graph',
  standalone: true,
  imports: [
    NgApexchartsModule,
    MatCardModule
  ],
  templateUrl: './blackbox-pie-graph.component.html',
  styleUrl: './blackbox-pie-graph.component.css'
})
export class BlackboxPieGraphComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor(
    private blackboxGraphsService: BlackboxGraphsService
  ) {
    this.chartOptions = {
      series: this.blackboxGraphsService.values,
      chart: {
        type: "pie",
        height: "400",
        width: "100%"
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
