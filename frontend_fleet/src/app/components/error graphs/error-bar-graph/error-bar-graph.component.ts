import { Component, ViewChild } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexGrid, ApexLegend, ApexPlotOptions, ApexYAxis, ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { ErrorGraphsService } from '../../../services/error-graphs-service/error-graphs.service';

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
export class ErrorBarGraphComponent {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  constructor(
    private errorGraphsService: ErrorGraphsService
  ) {
    this.chartOptions = {
      series: [
        {
          name: "Data",
          data: this.errorGraphsService.values
        }
      ],
      chart: {
        type: "bar",
        events: {
          click: function(chart, w, e) {
            // column click
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
}
