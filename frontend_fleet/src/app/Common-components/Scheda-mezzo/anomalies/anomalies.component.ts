import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { VehicleAnomalies } from '../../../Models/VehicleAnomalies';
import { ErrorGraphsService } from '../../../Dashboard/Services/error-graphs/error-graphs.service';
import { Vehicle } from '../../../Models/Vehicle';
import { Subject, takeUntil } from 'rxjs';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-anomalies',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './anomalies.component.html',
  styleUrl: './anomalies.component.css'
})
export class AnomaliesComponent implements OnInit, AfterViewInit{
  @Input() vehicle!: Vehicle;  private readonly destroy$: Subject<void> = new Subject<void>();

  gpsStatus!: string;
  antennaStatus!: string;
  sessionStatus!: string;

  gpsAnomaly!: string | null;
  antennaAnomaly!: string | null;
  sessionAnomaly!: string | null;

  workingColor!: string;
  warningColor!: string;
  errorColor!: string;

  vehicleAnomalies!: VehicleAnomalies;

  constructor(
    private errorGraphsService: ErrorGraphsService,
    private checkErrorsService: CheckErrorsService,
    private cd: ChangeDetectorRef
  ){}
  ngAfterViewInit(): void {
    this.checkAnomalies();
  }

  ngOnInit(): void {
    //impostazione colori da servizio
    this.workingColor = this.errorGraphsService.colors[0];
    this.warningColor = this.errorGraphsService.colors[1];
    this.errorColor = this.errorGraphsService.colors[2];
  }

  private checkAnomalies(){
    this.checkErrorsService.checkAnomaliesByVeId(this.vehicle.veId, 1).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicleAnomalies: VehicleAnomalies) => {
        this.vehicleAnomalies = vehicleAnomalies;
        if(vehicleAnomalies){
          const todayAnomalies = vehicleAnomalies.anomalies[0];
          this.gpsAnomaly = todayAnomalies.gps || "Funzionante" ;
          this.antennaAnomaly = todayAnomalies.antenna || "Funzionante";
          this.sessionAnomaly =todayAnomalies.session || "Funzionante";

          this.gpsStatus = this.checkErrorsService.checkGPSAnomalyType(todayAnomalies.gps);
          if(this.vehicle.allestimento){
            this.antennaStatus = todayAnomalies.antenna ? "Errore" : "Funzionante";
          }else{
            this.antennaStatus = "Blackbox";
            this.antennaAnomaly = "No antenna";
          }
          this.sessionStatus = todayAnomalies.session ? "Errore" : "Funzionante";
        }
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nella richiesta delle anomalie del veicolo dal database: ", error)
    });
  }
  checkGPSAnomalyColor(){
    return this.gpsStatus=='Funzionante' ? this.workingColor : this.gpsStatus=='Warning' ? this.warningColor : this.errorColor;
  }
}
