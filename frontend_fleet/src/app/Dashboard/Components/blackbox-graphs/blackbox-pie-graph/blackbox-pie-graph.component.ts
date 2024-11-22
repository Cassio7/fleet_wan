import { AfterViewInit, Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexTheme, ApexTitleSubtitle, NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { BlackboxGraphsService } from '../../../Services/blackbox-graphs/blackbox-graphs.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { ErrorGraphsService } from '../../../Services/error-graphs/error-graphs.service';
import { CheckErrorsService } from '../../../Services/check-errors/check-errors.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  theme: ApexTheme;
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-blackbox-pie-graph',
  standalone: true,
  imports: [
    NgApexchartsModule,
    MatCardModule
  ],
  templateUrl: './blackbox-pie-graph.component.html',
  styleUrls: ['./blackbox-pie-graph.component.css']
})
export class BlackboxPieGraphComponent implements AfterViewInit {
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild("chart") chart!: ChartComponent;

  public chartOptions: Partial<ChartOptions> = {
    series: [],
    chart: {
      type: "pie",
      height: "400",
      width: "100%",
      events: {
        dataPointSelection: (event, chartContext, config) => {
          switch (config.dataPointIndex) {
            case 0:
              this.blackbox();
              break;
            case 1:
              this.blackboxEantenna();
              break;
          }
        }
      }
    },
    labels: ["Blackbox", "BlackBox+antenna"],
    theme: {
      monochrome: {
        enabled: true,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "top",
          },
          chart: {
            height: "300",
          },
        },
      },
    ],
  };

  blackbox(){
    console.log("Premuto blackbox");
  }

  blackboxEantenna(){
    console.log("Premuto blackbox + antenna");
  }

  constructor(
    private blackboxGraphsService: BlackboxGraphsService,
    private checkErrorsService: CheckErrorsService,
    private errorGraphService: ErrorGraphsService,
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.chartOptions.series = this.blackboxGraphsService.loadGraphData$.value;
    //Carica i dati la prima volta
    this.blackboxGraphsService.loadGraphData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (series: number[]) => {
        this.chartOptions.series = series;
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel caricamento del grafico blacbox: ", error)
    });

    this.handleErrorGraphClick(); //Cambia dati visualizzati in base a click del grafico degli errori
  }

  handleErrorGraphClick(){
    this.errorGraphService.loadFunzionanteData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (workingVehicles: any[]) => {
        this.blackboxGraphsService.loadChartData(workingVehicles);
      },
      error: error => console.error("Errore nell'aggiornamento del grafico dei blackbox in base ai veicoli funzionanti: ", error)
    });
    this.errorGraphService.loadFunzionanteData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (workingVehicles: any[]) => {
        this.blackboxGraphsService.loadChartData(workingVehicles);
      },
      error: error => console.error("Errore nell'aggiornamento del grafico dei blackbox in base ai veicoli funzionanti: ", error)
    });
    this.errorGraphService.loadWarningData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (warningVehicles: any[]) => {
        this.blackboxGraphsService.loadChartData(warningVehicles);
      },
      error: error => console.error("Errore nell'aggiornamento del grafico dei blackbox in base ai veicoli funzionanti: ", error)
    });
    this.errorGraphService.loadErrorData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (errorVehicles: any[]) => {
        this.blackboxGraphsService.loadChartData(errorVehicles);
      },
      error: error => console.error("Errore nell'aggiornamento del grafico dei blackbox in base ai veicoli funzionanti: ", error)
    });
  }
}
