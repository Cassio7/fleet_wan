import { ErrorGraphsService } from '../../../Services/error-graphs/error-graphs.service';
import { MatCardModule } from '@angular/material/card';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive, ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { skip, Subject, takeUntil } from 'rxjs';
import { VehiclesApiService } from '../../../../Common-services/vehicles service/vehicles-api.service';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { Vehicle } from '../../../../Models/Vehicle';

// export type ChartOptions = {
//   series: ApexNonAxisChartSeries;
//   chart: ApexChart;
//   responsive: ApexResponsive[];
//   labels: any;
//   colors?: string[];
// };
export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  plotOptions: any;
};

@Component({
  selector: 'app-pie-error-graph',
  standalone: true,
  imports: [
    NgApexchartsModule,
    MatCardModule
  ],
  templateUrl: './error-pie-graph.component.html',
  styleUrl: './error-pie-graph.component.css',
  encapsulation: ViewEncapsulation.None
})

export class ErrorPieGraphComponent implements AfterViewInit, OnDestroy{
  @ViewChild("chart") chart!: ChartComponent;
  private readonly destroy$: Subject<void> = new Subject<void>();
  public chartOptions: any;

  public nVehicles: number = 0;

  constructor(
    private errorGraphsService: ErrorGraphsService,
    private cd: ChangeDetectorRef
  ) {
    this.chartOptions = {
      series: [],
      chart: {
        type: "donut",
        height: this.errorGraphsService.height,
        width: this.errorGraphsService.width,
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
      colors: this.errorGraphsService.colors,
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: "bottom"
            },
            chart: {
              width: this.errorGraphsService.width / 2,
              height: this.errorGraphsService.height / 2
            }
          }
        }
      ]
    };
  }

  workingClick() {
    this.errorGraphsService.workingClick();
  }

  warningClick() {
    this.errorGraphsService.warningClick();
  }

  errorClick() {
    this.errorGraphsService.errorClick();
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.chartOptions.series = this.errorGraphsService.loadGraphData$.value; //ottenere i dati del grafico
    //sottoscrizione al subject x caricare i dati del grafico
    this.errorGraphsService.loadGraphData$.pipe(skip(1),takeUntil(this.destroy$))
    .subscribe({
      next: (series: any[]) => {
        this.nVehicles = 0; //azzeramento contatore
        this.chartOptions.series = series; //ottenere i dati del grafico

        //somma series x ottenere numero di veicoli
        series.forEach(value => {
          this.nVehicles += value;
        });

        // if(this.chart){
        //   this.chart.highlightSeries("Funzionante");
        // }
        this.cd.detectChanges();
      },
      error: error => console.error(error)
    });
  }
}
