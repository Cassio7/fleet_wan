import { ChangeDetectorRef, Component } from '@angular/core';
import { skip, Subject, takeUntil } from 'rxjs';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { NgApexchartsModule } from "ng-apexcharts";
import { AntennaGraphService } from '../../../Services/antenna-graph/antenna-graph.service';
import { BlackboxGraphsService } from '../../../Services/blackbox-graphs/blackbox-graphs.service';
import { VehicleData } from '../../../../Models/VehicleData';
import { PlateFilterService } from '../../../../Common-services/plate-filter/plate-filter.service';
import { CheckErrorsService } from '../../../../Common-services/check-errors/check-errors.service';

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
  public chartOptions: any;

  public nVehicles: number = 0;

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
        height: this.antennaGraphService.height,
        width: this.antennaGraphService.width,
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
              width: this.antennaGraphService.width / 2,
              height: this.antennaGraphService.height / 2
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

    console.log([antennaCheck[0].length, antennaCheck[1].length, blackboxData.blackboxOnly.length]);
    this.chartOptions.series = [antennaCheck[0].length, antennaCheck[1].length, blackboxData.blackboxOnly.length];
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
    this.antennaGraphService.loadChartData$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicles: VehicleData[]) => {
        this.initializeGraph(vehicles);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel caricamento del grafico delle antenne: ", error)
    });
    this.cd.detectChanges();
  }
}
