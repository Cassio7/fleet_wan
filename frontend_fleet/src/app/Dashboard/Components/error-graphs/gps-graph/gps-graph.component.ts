import { ErrorGraphsService } from './../../../Services/error-graphs/error-graphs.service';
import { GpsGraphService } from './../../../Services/gps-graph/gps-graph.service';
import { AfterViewInit, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { NgApexchartsModule } from "ng-apexcharts";
import { Subject, skip, takeUntil } from 'rxjs';
import { CheckErrorsService } from '../../../Services/check-errors/check-errors.service';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { PlateFilterService } from '../../../../Common-services/plate-filter/plate-filter.service';
import { Vehicle } from '../../../../Models/Vehicle';

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
  public chartOptions: any;

  public nVehicles: number = 0;

  constructor(
    private gpsGraphService: GpsGraphService,
    private checkErrorsService: CheckErrorsService,
    private errorGraphsService: ErrorGraphsService,
    private plateFilterService: PlateFilterService,
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

  initializeGraph(vehicles: Vehicle[]){
    this.chartOptions.series = [];

    const gpsCheck = this.checkErrorsService.checkVehiclesGpsErrors(vehicles);
    console.log("gpsCheck: ", gpsCheck);

    const series = [gpsCheck[0].length, gpsCheck[1].length, gpsCheck[2].length];
    this.chartOptions.series = series;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    this.initializeGraph(allVehicles);
    this.plateFilterService.filterByPlateResearch$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (research: string)=>{
        const plateFilteredVehicles = this.plateFilterService.filterVehiclesByPlateResearch(research, allVehicles);
        this.initializeGraph(plateFilteredVehicles);
      },
      error: error => console.error("Errore nel filtro per la targa: ",error)
    });
    this.gpsGraphService.loadChartData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next:(vehicles: Vehicle[]) => {
        this.initializeGraph(vehicles);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel caricamento del grafico GPS: ", error)
    });
    this.cd.detectChanges();
  }

}
