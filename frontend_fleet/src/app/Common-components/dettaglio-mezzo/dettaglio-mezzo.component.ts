import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';
import { VehicleData } from '../../Models/VehicleData';
import { VehiclesApiService } from '../../Common-services/vehicles api service/vehicles-api.service';
import { Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';
import { CommonModule } from '@angular/common';
import { NotesService } from '../../Mezzi/Services/notes/notes.service';
import { Note } from '../../Models/Note';
import { User } from '../../Models/User';
import { AuthService } from '../../Common-services/auth/auth.service';
import { DetectionGraphComponent } from "../../Mezzi/Components/detection-graph/detection-graph.component";
import { NoteSectionComponent } from "../note-section/note-section.component";
import { CheckErrorsService } from '../../Common-services/check-errors/check-errors.service';
import { VehicleAnomalies } from '../../Models/VehicleAnomalies';
import { ErrorGraphsService } from '../../Dashboard/Services/error-graphs/error-graphs.service';


@Component({
  selector: 'app-dettaglio-mezzo',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatButtonModule,
    DetectionGraphComponent,
    NoteSectionComponent,
],
  templateUrl: './dettaglio-mezzo.component.html',
  styleUrl: './dettaglio-mezzo.component.css'
})
export class DettaglioMezzoComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();

  vehicleAnomalies!: VehicleAnomalies;

  gpsStatus!: string;
  antennaStatus!: string;
  sessionStatus!: string;

  workingColor!: string;
  warningColor!: string;
  errorColor!: string;

  private veId!: number;
  user!: User;
  vehicle!: Vehicle;


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private vehiclesApiService: VehiclesApiService,
    private errorGraphsService: ErrorGraphsService,
    private checkErrorsService: CheckErrorsService,
    private notesService: NotesService,
    private authService: AuthService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.checkAnomalies();
  }

  ngOnInit(): void {
    this.vehicle = JSON.parse(this.sessionStorageService.getItem("detail"));
    this.user = this.authService.getParsedAccessToken();
    if(!this.vehicle){
      this.route.params.pipe(takeUntil(this.destroy$)).
      subscribe(params => {
        this.veId = parseInt(params['id']);
        this.fetchVehicle();
      });
    }
    //impostazione colori da servizio
    this.workingColor = this.errorGraphsService.colors[0];
    this.warningColor = this.errorGraphsService.colors[1];
    this.errorColor = this.errorGraphsService.colors[2];
  }

  private fetchVehicle(): void {
    this.vehiclesApiService.getVehicleByVeId(this.veId).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehicle: Vehicle) => {
          this.vehicle = vehicle;
          this.sessionStorageService.setItem("detail", JSON.stringify(this.vehicle));
          this.cd.detectChanges();
          this.fetchVehicleNote();
          this.checkAnomalies();
        },
        error: (error) => {
          console.error("Errore nella ricerca del veicolo: ", error);
        }
      });
  }

  private fetchVehicleNote(){
    this.notesService.getNoteByVeId(this.vehicle.veId).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (note: Note) => {
        if(note){
          this.vehicle.note = note;
          this.sessionStorageService.setItem("detail", JSON.stringify(this.vehicle));
          this.cd.detectChanges();
        }
      },
      error: error => console.error("Errore nella ricerca della nota del veicolo: ", error)
    });
  }

  private checkAnomalies(){
    this.checkErrorsService.checkAnomaliesByVeId(this.vehicle.veId, 1).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicleAnomalies: VehicleAnomalies) => {
        this.vehicleAnomalies = vehicleAnomalies;
        console.log("vehicleAnomalies: ", vehicleAnomalies)
        if(vehicleAnomalies){
          const todayAnomalies = vehicleAnomalies.anomalies[0];
          this.gpsStatus = this.checkErrorsService.checkGPSAnomalyType(todayAnomalies.gps);
          if(this.vehicle.allestimento){
            this.antennaStatus = todayAnomalies.antenna ? "Errore" : "Funzionante";
          }else{
            this.antennaStatus = "Blackbox";
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

  goBack(): void {
    this.router.navigate(['/home-mezzi']); // Consider using a dynamic return path if necessary
    this.sessionStorageService.removeItem("detail");
  }
}
