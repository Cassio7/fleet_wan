import { GpsGraphService } from './../../../Services/gps-graph/gps-graph.service';
import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive, ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { Subject, skip, takeUntil } from 'rxjs';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  plotOptions: any;
};

@Component({
  selector: 'app-gps-graph',
  standalone: true,
  imports: [
    NgApexchartsModule
  ],
  templateUrl: './gps-graph.component.html',
  styleUrl: './gps-graph.component.css'
})
export class GpsGraphComponent implements AfterViewInit{
  @ViewChild("chart") chart!: ChartComponent;
    private readonly destroy$: Subject<void> = new Subject<void>();
    public chartOptions: any;

    public nVehicles: number = 0;

    constructor(
      private gpsGraphService: GpsGraphService,
      private cd: ChangeDetectorRef
    ) {
      this.chartOptions = {
        series: [],
        chart: {
          type: "donut",
          height: this.gpsGraphService.height,
          width: this.gpsGraphService.width
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                total: {
                  showAlways: true,
                  show: true,
                  label: "mezzi",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#000",
                }
              }
            }
          }
        },
        labels: ["Funzionante", "Warning", "Error"],
        colors: this.gpsGraphService.colors,
        responsive: [
          {
            breakpoint: 480,
            options: {
              legend: {
                position: "bottom"
              },
              chart: {
                width: this.gpsGraphService.width / 2,
                height: this.gpsGraphService.height / 2
              }
            }
          }
        ]
      };
    }



    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

    ngAfterViewInit(): void {
      this.chartOptions.series = this.gpsGraphService.series;
      this.cd.detectChanges();
    }
}
