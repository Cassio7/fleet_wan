import { AfterViewInit, Component, Input } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexGrid, ApexStroke, ApexTitleSubtitle, ApexYAxis } from 'ng-apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DetectionGraphService } from '../../Services/detection-graph/detection-graph.service';
import { Vehicle } from '../../../Models/Vehicle';
import { Subject, takeUntil } from 'rxjs';
import { DetectionQuality } from '../../../Models/DetectionQuality';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
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
export class DetectionGraphComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @Input() veId!: number;
  public chartOptions: Partial<ChartOptions>;

  constructor(private detectionGraphService: DetectionGraphService){
    this.chartOptions = {
      series: [
      ],
      chart: {
        height: 320,
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
          opacity: 0.2,
        },
      },
      yaxis: {
        title: {
          text: 'Qualità lettura'
        },
      },
      xaxis: {
        type: "datetime",
        categories: [
        ],
      },
    };
  }
  ngAfterViewInit(): void {
    this.detectionGraphService.getDetectionQualityByVeId(this.veId).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (detectionQualities: DetectionQuality[]) => {
          console.log("detectionQualities fetched: ", detectionQualities);
        if(detectionQualities){
          const data: any = [];
          let minY = Infinity;
          let maxY = -Infinity;

          detectionQualities.forEach(detection => {
            if(detection){
              const yValue = detection.detection_quality;
              minY = Math.min(minY, yValue);
              maxY = Math.max(maxY, yValue);

              const newDataEl = { x: new Date(detection.timestamp).getTime(), y: yValue };
              data.push(newDataEl);
            }
          });

          this.chartOptions.series?.push({name: "detection", data});

          this.chartOptions.yaxis = {
            ...this.chartOptions.yaxis,
          };
        }
      },
      error: error => console.error("Errore nella ricerca delle qualità di lettura: ", error)
    });
  }
}
