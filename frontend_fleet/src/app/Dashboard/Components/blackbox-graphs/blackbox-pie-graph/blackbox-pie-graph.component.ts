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

  public chartOptions: Partial<ChartOptions> = {
    chart: {
      type: "pie",
      height: "400",
      width: "100%",
    },
    labels: ["Blackbox", "BlackBox+antenna"],
    theme: {
      monochrome: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "top",
          },
          chart: {
            height: "300",
          },
        },
      },
    ],
    series: [],
  };

  constructor(private blackboxGraphsService: BlackboxGraphsService) {}

  async ngOnInit(): Promise<void> {

    try {
      // Carica dati presi dal servizio nel grafico
      const series = await this.blackboxGraphsService.loadChartData();
      this.chartOptions.series = series;
    } catch (error) {
      console.error("Error initializing chart data: ", error);
    }
  }
}
