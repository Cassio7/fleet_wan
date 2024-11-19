import { AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexTheme, ApexTitleSubtitle, NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { BlackboxGraphsService } from '../../../Services/blackbox-graphs/blackbox-graphs.service';
import { Subject } from 'rxjs';

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
  styleUrls: ['./blackbox-pie-graph.component.css']
})
export class BlackboxPieGraphComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  private series: number[] = [];
  public chartOptions: Partial<ChartOptions> = {
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

  constructor(private blackboxGraphsService: BlackboxGraphsService) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  async loadChartData(): Promise<void> {
    try {
      const categorizedVehicles = await this.blackboxGraphsService.getAllRFIDVehicles();
      this.series = [
        categorizedVehicles.blackboxOnly.length,
        categorizedVehicles.blackboxWithAntenna.length
      ];

      // Update chart options
      this.chartOptions = {
        ...this.chartOptions,
        series: this.series
      };
    } catch (error) {
      console.error("Error loading chart data: ", error);
    }
  }
}
