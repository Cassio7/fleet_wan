import { AfterViewInit, Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MapService, positionData } from '../../../Common-services/map/map.service';
import { takeUntil, skip, Subject } from 'rxjs';
import { CheckErrorsService, VehicleAnomalies } from '../../../Common-services/check-errors/check-errors.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Vehicle } from '../../../Models/Vehicle';
import { SvgService } from '../../../Common-services/svg/svg.service';

@Component({
  selector: 'app-mappa-info',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './mappa-info.component.html',
  styleUrl: './mappa-info.component.css'
})
export class MappaInfoComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @Output() selectVehicle = new EventEmitter();
  @Output() closePopup = new EventEmitter();

  veId!: number;
  servizio!: string;
  plate!: string;
  cantiere!: string;
  gpsAnomaly!: string;
  antennaAnomaly!: string;
  sessioneAnomaly!: string;
  anomalyDate!: Date | null;
  selectedVehicle!: Vehicle;

  constructor(
    public svgService: SvgService,
    public checkErrorsService: CheckErrorsService,
    private mapService:MapService,
    private router: Router
  ){}


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.mapService.selectMarker$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (positionData: positionData) => {
        //chiamata http x anomalie
        console.log(`Request for anomalies for plate: ${positionData.veId} who has this plate: ${positionData.plate}`);
        this.checkErrorsService.checkAnomaliesByVeId(positionData.veId, 1).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (vehicleAnomalies: VehicleAnomalies) => {
            console.log('selected vehicle.service.id: ', this.selectedVehicle?.service?.id);
            this.plate = positionData.plate;
            this.cantiere = positionData.cantiere || "";
            this.setData(vehicleAnomalies);
            this.mapService.zoomIn$.next({point: positionData.position, zoom: 16});
            this.selectVehicle.emit();
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
    console.log("setting this vehiclesanomalies data: ", vehicleAnomalies);
    if(vehicleAnomalies){
      const vehicle = vehicleAnomalies.vehicle;
      const currentAnomaly = vehicleAnomalies.anomalies[0];
      this.selectedVehicle = vehicleAnomalies.vehicle;
      this.veId = vehicle.veId;
      this.servizio = vehicle?.service?.name || "";
      this.gpsAnomaly = currentAnomaly.gps || "";
      this.antennaAnomaly = currentAnomaly.antenna || "";
      this.sessioneAnomaly = currentAnomaly.session || "";
      this.anomalyDate = currentAnomaly.date;
    }
  }

  /**
   * Naviga alla pagina di dettaglio del veicolo
   * @param vehicleId id del veicolo del quale visualizzare il dettaglio
   */
  viewDetails(){
    this.router.navigate(['/dettaglio-mezzo', this.veId]);
  }

}
