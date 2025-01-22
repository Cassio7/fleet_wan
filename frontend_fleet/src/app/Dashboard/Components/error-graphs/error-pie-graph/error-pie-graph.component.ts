import { ErrorGraphsService, ErrorsData } from '../../../Services/error-graphs/error-graphs.service';
import { MatCardModule } from '@angular/material/card';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ApexChart, ApexNonAxisChartSeries, ApexResponsive, ChartComponent, NgApexchartsModule } from "ng-apexcharts";
import { skip, Subject, takeUntil } from 'rxjs';
import { VehicleData } from '../../../../Models/VehicleData';

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
  colors: string[];
  legend: any;
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
  private readonly destroy$: Subject<void> = new Subject<void>();
  public chartOptions: Partial<ChartOptions>;

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
      legend: {
        position: "left"
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

  /**
   * Click sulla fetta "funzionante" del grafico
   */
  workingClick() {
    this.errorGraphsService.workingClick();
  }
  /**
   * Click sulla fetta "warning" del grafico
   */
  warningClick() {
    this.errorGraphsService.warningClick();
  }
  /**
   * Click sulla fetta "error" del grafico
   */
  errorClick() {
    this.errorGraphsService.errorClick();
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeGraph(vehicles: VehicleData[]){
    const errorsData: ErrorsData = this.errorGraphsService.loadChartData(vehicles);
    const series = [errorsData.workingVehicles.length, errorsData.warningVehicles.length, errorsData.errorVehicles.length];
    this.nVehicles = 0; //azzeramento contatore
    this.chartOptions.series = series; //ottenere i dati del grafico

    //somma series x ottenere numero di veicoli
    series.forEach(value => {
      this.nVehicles += value;
    });
  }

  ngAfterViewInit(): void {
    this.chartOptions.series = this.errorGraphsService.loadGraphData$.value; //ottenere i dati del grafico
    //sottoscrizione al subject x caricare i dati del grafico
    this.errorGraphsService.loadGraphData$.pipe(skip(1),takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: VehicleData[]) => {
        this.initializeGraph(vehicles);

        this.cd.detectChanges();
      },
      error: error => console.error(error)
    });
  }
}
