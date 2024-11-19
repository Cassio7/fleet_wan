import { BlackboxGraphsService } from '../../../Services/blackbox-graphs/blackbox-graphs.service';
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
  templateUrl: './blackbox-pie-graph.component.html',
  styleUrl: './blackbox-pie-graph.component.css',
  encapsulation: ViewEncapsulation.None
})

export class BlackboxGraphComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor(
    private blackboxGraphsService: BlackboxGraphsService
  ) {
    this.chartOptions = {
      series: this.blackboxGraphsService.values,
      chart: {
        type: "pie",
        height: "400", // Increase this value as needed to make the chart larger
        width: "100%"  // Set to 100% to take full width of the parent container
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
              height: "300" // Adjust the height for smaller screens if necessary
            }
          }
        }
      ]
    };

  }
}
