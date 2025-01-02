import { GpsGraphService } from './../../../Services/gps-graph/gps-graph.service';
import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive, ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { Subject, skip, takeUntil } from 'rxjs';
import { CheckErrorsService } from '../../../Services/check-errors/check-errors.service';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';

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
      private checkErrorsService: CheckErrorsService,
      private sessionStorageService: SessionStorageService,
      private cd: ChangeDetectorRef
    ) {
      this.chartOptions = {
        series: [],
        chart: {
          type: "donut",
          height: this.gpsGraphService.height,
          width: this.gpsGraphService.width,
          events: {
            dataPointSelection: (event: any, chartContext: any, config: any) => {
              switch (config.dataPointIndex) {
                case 0:
                  this.workingClick();
                  break;
                case 1:
                  this.warningClick();
                  break;
                case 2:
                  this.errorClick();
                  break;
              }
            }
          }
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

    /**
     * Click sulla fetta "funzionante" del grafico
     */
    workingClick() {
      console.log("working gps");
    }
    /**
     * Click sulla fetta "warning" del grafico
     */
    warningClick() {
      console.log("warning gps");
    }
    /**
     * Click sulla fetta "error" del grafico
     */
    errorClick() {
      console.log("error gps");
    }

    ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
    }

    ngAfterViewInit(): void {
      this.chartOptions.series = [];

      const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
      const gpsCheck = this.checkErrorsService.checkVehiclesGpsErrors(allVehicles);

      this.chartOptions.series = [gpsCheck[0].length, gpsCheck[1].length, gpsCheck[2].length];
      this.cd.detectChanges();
    }
}
