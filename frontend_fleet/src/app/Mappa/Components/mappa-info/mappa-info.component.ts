import { AfterViewInit, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MapService, positionData } from '../../../Common-services/map/map.service';
import { takeUntil, skip, Subject } from 'rxjs';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VehicleAnomalies } from '../../../Models/VehicleAnomalies';

@Component({
  selector: 'app-mappa-info',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './mappa-info.component.html',
  styleUrl: './mappa-info.component.css'
})
export class MappaInfoComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  servizio: string = "";
  plate: string = "";
  cantiere: string = "";
  gps: string = "";
  antenna: string = "";
  sessione: string = "";
  anomalyDate!: Date | null;
  vehicleSelected: boolean = false;

  constructor(
    public checkErrorsService: CheckErrorsService,
    private mapService:MapService,
  ){}

  ngAfterViewInit(): void {
    this.mapService.selectMarker$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (positionData: positionData) => {
        //chiamata http x anomalie
        console.log(`Request for anomalies for plate: ${positionData.veId} who has this plate: ${positionData.plate}`);
        this.checkErrorsService.checkAnomaliesByVeId(positionData.veId, 1).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (vehicleAnomalies: VehicleAnomalies) => {
            console.log("vehicleAnomalies fetched: ", vehicleAnomalies.anomalies);
            this.setData(vehicleAnomalies);
            this.mapService.zoomIn$.next({point: positionData.position, zoom: 16});
          },
          error: error => console.error("Errore nella ricezione del controllo delle anomalie: ", error)
        });
      },
      error: error => console.error("Errore nella selezione del marker: ", error)
    });
  }

  /**
   * Imposta i dati nella vista
   * @param vehicleAnomalies oggetto da cui prendere i dati
   */
  private setData(vehicleAnomalies: VehicleAnomalies){
    if(vehicleAnomalies){
      const vehicle = vehicleAnomalies.vehicle;
      const currentAnomaly = vehicleAnomalies.anomalies[0];
      this.vehicleSelected = true;
      this.servizio = vehicle.service.name;
      this.plate = vehicle.plate;
      this.cantiere = vehicle.worksite.name;
      this.gps = currentAnomaly.gps || "";
      this.antenna = currentAnomaly.antenna || "";
      this.sessione = currentAnomaly.session || "";
      this.anomalyDate = currentAnomaly.date;
    }else{
      this.vehicleSelected = false;
      this.servizio = "Nessun dato";
      this.plate = "Nessun dato";
      this.cantiere = "Nessun dato";
      this.gps = "Nessun dato";
      this.antenna = "Nessun dato";
      this.sessione = "Nessun dato";
      this.anomalyDate = null;
    }
  }

}
