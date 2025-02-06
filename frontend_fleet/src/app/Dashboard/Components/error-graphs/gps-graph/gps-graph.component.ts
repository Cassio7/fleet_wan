import { ErrorGraphsService } from './../../../Services/error-graphs/error-graphs.service';
import { GpsGraphService } from './../../../Services/gps-graph/gps-graph.service';
import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ApexChart, ApexDataLabels, ApexLegend, ApexNonAxisChartSeries, ApexResponsive, NgApexchartsModule } from "ng-apexcharts";
import { Subject, skip, takeUntil } from 'rxjs';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { PlateFilterService } from '../../../../Common-services/plate-filter/plate-filter.service';
import { CheckErrorsService } from '../../../../Common-services/check-errors/check-errors.service';
import { VehicleData } from '../../../../Models/VehicleData';
import { FiltersCommonService } from '../../../../Common-services/filters-common/filters-common.service';
import { style } from '@angular/animations';


export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  colors: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
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
  private readonly destroy$: Subject<void> = new Subject<void>();
  public chartOptions: ChartOptions;

  public nVehicles: number = 0;
  private width: number = 300;
  private height: number = 120;

  constructor(
    private gpsGraphService: GpsGraphService,
    private checkErrorsService: CheckErrorsService,
    private filtersCommonService: FiltersCommonService,
    private plateFilterService: PlateFilterService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ) {
    this.chartOptions = {
      series: [],
      chart: {
        type: "donut",
        height: this.height,
        width: this.width,
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
      legend: {
        position: "left"
      },
      dataLabels: {
        enabled: false
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
              width: this.width / 2,
              height: this.height / 2
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

  initializeGraph(vehicles: VehicleData[]){
    this.chartOptions.series = [];

    const gpsCheck = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);

    const series = [gpsCheck[0].length, gpsCheck[1].length, gpsCheck[2].length];
    this.chartOptions.series = series;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.gpsGraphService.loadChartData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next:(vehicles: VehicleData[]) => {
        this.initializeGraph(vehicles);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel caricamento del grafico GPS: ", error)
    });
    this.cd.detectChanges();
  }

}
