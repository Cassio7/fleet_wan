import { AfterViewInit, Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexTheme, ApexTitleSubtitle, NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { BlackboxGraphsService } from '../../../Services/blackbox-graphs/blackbox-graphs.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { ErrorGraphsService } from '../../../Services/error-graphs/error-graphs.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  theme: ApexTheme;
  title: ApexTitleSubtitle;
  plotOptions: any;
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

  public chartOptions: Partial<ChartOptions>;
  public nVehicles: number = 0;

  blackbox(){
    this.blackboxGraphsService.blackBoxClick();
  }

  blackboxEantenna(){
    this.blackboxGraphsService.blackBoxAntennaClick();
  }

  constructor(
    private blackboxGraphsService: BlackboxGraphsService,
    private cd: ChangeDetectorRef
  ) {
    this.chartOptions = {
      series: [],
      chart: {
        type: "donut",
        height: this.blackboxGraphsService.height,
        width: this.blackboxGraphsService.width,
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
      labels: ["Blackbox", "Blackbox+antenna"],
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
              position: "bottom",
            },
            chart: {
              height: blackboxGraphsService.height / 2,
            },
          },
        },
      ],
    };
  }

  ngAfterViewInit() {
    this.chartOptions.series = this.blackboxGraphsService.loadGraphData$.value;
    //Carica i dati la prima volta
    this.blackboxGraphsService.loadGraphData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (series: number[]) => {
        this.nVehicles = 0; //azzeramento contatore dei veicoli
        this.chartOptions.series = series;

        series.forEach(serie => {
          this.nVehicles += serie;
        });

        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel caricamento del grafico blacbox: ", error)
    });
  }
}
