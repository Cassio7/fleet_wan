import { BlackboxGraphsService } from '../../../Services/blackbox-graphs/blackbox-graphs.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexGrid, ApexLegend, ApexPlotOptions, ApexYAxis, ChartComponent, NgApexchartsModule } from 'ng-apexcharts';

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
  selector: 'app-blackbox-bar-graph',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './blackbox-bar-graph.component.html',
  styleUrl: './blackbox-bar-graph.component.css'
})
export class BlackboxBarGraphComponent implements OnInit{
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor(private blackboxGraphsService: BlackboxGraphsService) {
    this.chartOptions = {
      series: [
        {
          name: "Data",
          data: [],
        },
      ],
      chart: {
        type: "bar",
        events: {
          click: function (chart, w, e) {
            // Per gestione click su colonne
          },
        },
      },
      colors: this.blackboxGraphsService.colors,
      plotOptions: {
        bar: {
          columnWidth: "45%",
          distributed: true,
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        show: false,
      },
      grid: {
        show: false,
      },
      xaxis: {
        categories: ["Blackbox", "Blackbox + antenna"],
        labels: {
          style: {
            colors: this.blackboxGraphsService.colors,
            fontSize: "12px",
          },
        },
      },
    };
  }

  async ngOnInit(): Promise<void> {
    //carica i dati nel grafico
    try {
      const seriesData = await this.blackboxGraphsService.loadChartData();
      this.chartOptions.series = [
        {
          name: "Data",
          data: seriesData,
        },
      ];
    } catch (error) {
      console.error("Errore durante il caricamento dei dati del grafico: ", error);
    }
  }
}
