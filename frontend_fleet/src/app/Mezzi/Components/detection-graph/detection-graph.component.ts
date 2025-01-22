import { AfterViewInit, Component, Input } from '@angular/core';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexGrid, ApexStroke, ApexTitleSubtitle } from 'ng-apexcharts';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DetectionGraphService } from '../../Services/detection-graph/detection-graph.service';
import { Vehicle } from '../../../Models/Vehicle';
import { Subject, takeUntil } from 'rxjs';
import { DetectionQuality } from '../../../Models/DetectionQuality';

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
export class DetectionGraphComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @Input() vehicle!: Vehicle;
  public chartOptions: Partial<ChartOptions>;

  constructor(private detectionGraphService: DetectionGraphService){
    this.chartOptions = {
      series: [
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
  ngAfterViewInit(): void {
    this.detectionGraphService.getDetectionQualityByVeId(this.vehicle.veId).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (detectionQualities: DetectionQuality[]) => {
        if(detectionQualities){
          console.log("detectionQualities fetched: ", detectionQualities);
          const data: any = [];
          detectionQualities.forEach(detection => {
            if(detection){
              const newDataEl = { x: new Date(detection.timestamp).getTime(), y: detection.detection_quality };
              data.push(newDataEl);
            }
          });
          this.chartOptions.series?.push({name: "detection", data});
        }
      },
      error: error => console.error("Errore nella ricerca delle qualità di lettura: ", error)
    });
  }
}
