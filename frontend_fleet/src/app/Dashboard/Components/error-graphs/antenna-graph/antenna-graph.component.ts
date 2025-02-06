import { ChangeDetectorRef, Component } from '@angular/core';
import { skip, Subject, takeUntil } from 'rxjs';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { ApexChart, ApexDataLabels, ApexLegend, ApexNonAxisChartSeries, ApexResponsive, NgApexchartsModule } from "ng-apexcharts";
import { AntennaGraphService } from '../../../Services/antenna-graph/antenna-graph.service';
import { BlackboxGraphsService } from '../../../Services/blackbox-graphs/blackbox-graphs.service';
import { VehicleData } from '../../../../Models/VehicleData';
import { PlateFilterService } from '../../../../Common-services/plate-filter/plate-filter.service';
import { CheckErrorsService } from '../../../../Common-services/check-errors/check-errors.service';


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
  selector: 'app-antenna-graph',
  standalone: true,
  imports: [
    NgApexchartsModule
  ],
  templateUrl: './antenna-graph.component.html',
  styleUrl: './antenna-graph.component.css'
})
export class AntennaGraphComponent {
  private readonly destroy$: Subject<void> = new Subject<void>();
  public chartOptions: ChartOptions;

  public nVehicles: number = 0;

  private width: number = 300;
  private height: number = 120;

  constructor(
    private antennaGraphService: AntennaGraphService,
    private plateFilterService: PlateFilterService,
    private checkErrorsService: CheckErrorsService,
    private blackboxGraphService: BlackboxGraphsService,
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
      labels: ["Funzionante", "Error", "No antenna"],
      colors: this.antennaGraphService.colors,
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

    const antennaCheck = this.checkErrorsService.checkVehiclesAntennaErrors(vehicles);
    const blackboxData = this.blackboxGraphService.getAllRFIDVehicles(vehicles);

    this.chartOptions.series = [antennaCheck[0].length, antennaCheck[1].length, blackboxData.blackboxOnly.length];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.antennaGraphService.loadChartData$.pipe(takeUntil(this.destroy$))
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
