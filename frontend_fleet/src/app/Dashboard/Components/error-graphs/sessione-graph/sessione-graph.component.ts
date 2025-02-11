import { ChangeDetectorRef, Component } from '@angular/core';
import { skip, Subject, takeUntil } from 'rxjs';
import {
  ApexChart,
  ApexDataLabels,
  ApexNonAxisChartSeries,
  ApexResponsive,
  NgApexchartsModule,
} from 'ng-apexcharts';
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
  imports: [NgApexchartsModule],
  templateUrl: './sessione-graph.component.html',
  styleUrl: './sessione-graph.component.css',
})
export class SessioneGraphComponent {
  private readonly destroy$: Subject<void> = new Subject<void>();
  public chartOptions: ChartOptions;
  private width: number = 300;
  private height: number = 120;

  constructor(
    private sessioneGraphService: SessioneGraphService,
    private checkErrorsService: CheckErrorsService,
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
                offsetY: -20
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
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: 'left',
        fontFamily: 'Inter',
        fontSize: '14px',
      },
      labels: true,
      colors: this.sessioneGraphService.colors,
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

    const sessionCheck =
      this.checkErrorsService.checkVehiclesSessionErrors(vehicles);
      this.chartOptions.labels = [
        `<div style='width: 110px; display:flex; justify-content: space-between'><span>Ok</span> <span>${sessionCheck[0].length}</span></div>`,
        `<div style='width: 110px; display:flex; justify-content: space-between'><span>Error</span><span>${sessionCheck[1].length}</span></div>`,
      ];

    this.chartOptions.series = [sessionCheck[0].length, sessionCheck[1].length];
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.sessioneGraphService.loadChartData$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (vehicles: VehicleData[]) => {
          console.log('mi è arrivato!');
          this.initializeGraph(vehicles);
          this.cd.detectChanges();
        },
        error: (error) =>
          console.error('Errore nel caricamento del grafico GPS: ', error),
      });
    this.cd.detectChanges();
  }
}
