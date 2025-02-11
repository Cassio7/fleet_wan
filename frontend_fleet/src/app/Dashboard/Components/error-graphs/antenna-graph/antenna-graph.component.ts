import { ChangeDetectorRef, Component } from '@angular/core';
import {
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexResponsive,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { skip, Subject, takeUntil } from 'rxjs';
import { CheckErrorsService } from '../../../../Common-services/check-errors/check-errors.service';
import { PlateFilterService } from '../../../../Common-services/plate-filter/plate-filter.service';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { VehicleData } from '../../../../Models/VehicleData';
import { AntennaGraphService } from '../../../Services/antenna-graph/antenna-graph.service';
import { BlackboxGraphsService } from '../../../Services/blackbox-graphs/blackbox-graphs.service';

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
  imports: [NgApexchartsModule],
  templateUrl: './antenna-graph.component.html',
  styleUrl: './antenna-graph.component.css',
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
        type: 'donut',
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
          },
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontWeight: 400,
                offsetY: 20,
              },
              value: {
                show: true,
                fontSize: '22px',
                fontWeight: 600,
                offsetY: -20,
              },
              total: {
                showAlways: true,
                show: true,
                label: 'mezzi',
                color: '#1A1919',
              },
            },
          },
        },
      },
      legend: {
        position: 'left',
        fontFamily: 'Inter',
        fontSize: '14px',
      },
      dataLabels: {
        enabled: false,
      },
      labels: true,
      colors: this.antennaGraphService.colors,
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: 'bottom',
            },
            chart: {
              width: this.width / 2,
              height: this.height / 2,
            },
          },
        },
      ],
    };
  }

  /**
   * Click sulla fetta "funzionante" del grafico
   */
  workingClick() {
    console.log('working gps');
  }
  /**
   * Click sulla fetta "warning" del grafico
   */
  warningClick() {
    console.log('warning gps');
  }
  /**
   * Click sulla fetta "error" del grafico
   */
  errorClick() {
    console.log('error gps');
  }

  initializeGraph(vehicles: VehicleData[]) {
    this.chartOptions.series = [];

    const antennaCheck =
      this.checkErrorsService.checkVehiclesAntennaErrors(vehicles);
    const blackboxData = this.blackboxGraphService.getAllRFIDVehicles(vehicles);
    this.chartOptions.labels = [
      `<div style='width: 110px; display:flex; justify-content: space-between'><span>Ok</span> <span>${antennaCheck[0].length}</span></div>`,
      `<div style='width: 110px; display:flex; justify-content: space-between'><span>Error</span><span>${antennaCheck[1].length}</span></div>`,
      `<div style='width: 110px; display:flex; justify-content: space-between'><span>No RFID</span><span>${blackboxData.blackboxOnly.length}</span></b>`,
    ];
    this.chartOptions.series = [
      antennaCheck[0].length,
      antennaCheck[1].length,
      blackboxData.blackboxOnly.length,
    ];

    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.antennaGraphService.loadChartData$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (vehicles: VehicleData[]) => {
          this.initializeGraph(vehicles);
          this.cd.detectChanges();
        },
        error: (error) =>
          console.error('Errore nel caricamento del grafico GPS: ', error),
      });
    this.cd.detectChanges();
  }
}
