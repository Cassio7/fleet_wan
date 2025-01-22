import { Component } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexGrid, ApexStroke, ApexTitleSubtitle } from 'ng-apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DetectionGraphService } from '../../Services/detection-graph/detection-graph.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  colors: string[];
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-detection-graph',
  standalone: true,
  imports: [
    NgApexchartsModule
  ],
  templateUrl: './detection-graph.component.html',
  styleUrl: './detection-graph.component.css'
})
export class DetectionGraphComponent {
  public chartOptions: Partial<ChartOptions>;

  constructor(private detectionGraphService: DetectionGraphService){
    this.chartOptions = {
      series: [
        {
          name: "qualità lettura",
          data: [
            // Giorno 1
            { x: new Date("2018-02-12 08:00:00").getTime(), y: 76 },
            { x: new Date("2018-02-12 10:00:00").getTime(), y: 79 },
            { x: new Date("2018-02-12 12:00:00").getTime(), y: 85 },
            { x: new Date("2018-02-12 14:00:00").getTime(), y: 82 },
            { x: new Date("2018-02-12 16:00:00").getTime(), y: 89 },
            { x: new Date("2018-02-12 18:00:00").getTime(), y: 88 },
            { x: new Date("2018-02-12 20:00:00").getTime(), y: 90 },
            { x: new Date("2018-02-12 22:00:00").getTime(), y: 91 },
            // Giorno 2
            { x: new Date("2018-02-13 00:00:00").getTime(), y: 78 },
            { x: new Date("2018-02-13 10:00:00").getTime(), y: 80 },
            { x: new Date("2018-02-13 12:00:00").getTime(), y: 83 },
            { x: new Date("2018-02-13 14:00:00").getTime(), y: 84 },
            { x: new Date("2018-02-13 16:00:00").getTime(), y: 86 },
            { x: new Date("2018-02-13 18:00:00").getTime(), y: 85 },
            { x: new Date("2018-02-13 20:00:00").getTime(), y: 87 },
            { x: new Date("2018-02-13 22:00:00").getTime(), y: 88 },
            // Giorno 3
            { x: new Date("2018-02-14 08:00:00").getTime(), y: 77 },
            { x: new Date("2018-02-14 10:00:00").getTime(), y: 81 },
            { x: new Date("2018-02-14 12:00:00").getTime(), y: 82 },
            { x: new Date("2018-02-14 14:00:00").getTime(), y: 85 },
            { x: new Date("2018-02-14 16:00:00").getTime(), y: 87 },
            { x: new Date("2018-02-14 18:00:00").getTime(), y: 89 },
            { x: new Date("2018-02-14 20:00:00").getTime(), y: 92 },
            { x: new Date("2018-02-14 22:00:00").getTime(), y: 94 },
            // Continua per altre giornate...
          ],
        },
      ],
      chart: {
        height: 350,
        type: "line",
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: this.detectionGraphService.colors,
      stroke: {
        curve: "straight",
      },
      title: {
        text: "Report qualità delle letture",
        align: "left",
      },
      grid: {
        row: {
          colors: ["#f3f3f3", "transparent"],
          opacity: 0.5,
        },
      },
      xaxis: {
        type: "datetime",
        categories: [
          // Dates should be formatted or handled appropriately if used in categories
        ],
      },
    };
  }
}
