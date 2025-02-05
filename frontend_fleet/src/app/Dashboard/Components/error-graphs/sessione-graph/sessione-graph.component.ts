import { ChangeDetectorRef, Component } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ApexChart, ApexDataLabels, ApexNonAxisChartSeries, ApexResponsive, NgApexchartsModule } from "ng-apexcharts";
import { SessioneGraphService } from '../../../Services/sessione-graph/sessione-graph.service';
import { CheckErrorsService } from '../../../../Common-services/check-errors/check-errors.service';
import { VehicleData } from '../../../../Models/VehicleData';


export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  colors: string[];
  legend: any;
  dataLabels: ApexDataLabels;
  labels: any;
  plotOptions: any;
};
@Component({
  selector: 'app-sessione-graph',
  standalone: true,
  imports: [
    NgApexchartsModule
  ],
  templateUrl: './sessione-graph.component.html',
  styleUrl: './sessione-graph.component.css'
})
export class SessioneGraphComponent {
    private readonly destroy$: Subject<void> = new Subject<void>();
    public chartOptions: ChartOptions;

  constructor(
    private sessioneGraphService: SessioneGraphService,
    private checkErrorsService: CheckErrorsService,
    private cd: ChangeDetectorRef
  ){
    this.chartOptions = {
      series: [],
      chart: {
        type: "donut",
        height: this.sessioneGraphService.height,
        width: this.sessioneGraphService.width,
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            switch (config.dataPointIndex) {
              case 0:
                this.workingClick();
                break;
              case 1:
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
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        position: "left"
      },
      labels: ["Funzionante", "Error"],
      colors: this.sessioneGraphService.colors,
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: "bottom"
            },
            chart: {
              width: this.sessioneGraphService.width / 2,
              height: this.sessioneGraphService.height / 2
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

    const sessionCheck = this.checkErrorsService.checkVehiclesSessionErrors(vehicles);

    console.log("sessionCheck: ", sessionCheck);

    this.chartOptions.series = [sessionCheck[0].length, sessionCheck[1].length];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.sessioneGraphService.loadChartData$.pipe(takeUntil(this.destroy$))
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
