import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { NavigationStart, Router } from '@angular/router';
import { ApexAxisChartSeries, ApexChart, ApexDataLabels, ApexGrid, ApexStroke, ApexTitleSubtitle, ApexXAxis, ApexYAxis, NgApexchartsModule } from 'ng-apexcharts';
import { Subject, takeUntil } from 'rxjs';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { DetectionGraphService, DetectionQuality } from '../../Services/detection-graph/detection-graph.service';

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
    CommonModule,
    NgApexchartsModule,
    MatChipsModule
  ],
  templateUrl: './detection-graph.component.html',
  styleUrl: './detection-graph.component.css'
})
export class DetectionGraphComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @Input() veId!: number;
  selectedRange: string = '';
  public chartOptions: Partial<ChartOptions>;

  constructor(
    private detectionGraphService: DetectionGraphService,
    private sessionStorageService: SessionStorageService,
    private router: Router,
    private cd: ChangeDetectorRef
  ){
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
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  ngAfterViewInit(): void {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.sessionStorageService.removeItem("selectedRange");
      }
    });
    const body = {
      veId: this.veId,
      months: 3,
      days: 0
    }
    const selectedRange = this.sessionStorageService.getItem("selectedRange");
    this.selectedRange = selectedRange || "3 M";
    this.loadGraph(body);
    this.cd.detectChanges();
  }

  loadGraph(
    body: {
      veId: number,
      months: number,
      days: number
    }
  ){
    this.detectionGraphService.getDetectionQualityByVeId(body).pipe(takeUntil(this.destroy$))
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

  setGraphDataRange(chipText: string){
    this.selectedRange = chipText;
    this.sessionStorageService.setItem("selectedRange", chipText);
    this.chartOptions.series = [];
    const body = {
      veId: this.veId,
      months: 0,
      days: 0
    }
    switch(chipText){
      case "10 G":
        body.days = 10;
        this.loadGraph(body);
        break;
      case "1 M":
        body.months = 1;
        this.loadGraph(body);
        break;
      case "3 M":
        body.months = 3;
        this.loadGraph(body);
        break;
      case "1 A":
        body.months = 12;
        this.loadGraph(body);
        break;
    }
  }
}
