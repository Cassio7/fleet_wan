import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../../Models/Vehicle';
import { CommonModule } from '@angular/common';
import { NotesService } from '../../../Common-services/notes/notes.service';
import { Note } from '../../../Models/Note';
import { User } from '../../../Models/User';
import { AuthService } from '../../../Common-services/auth/auth.service';
import { DetectionGraphComponent } from "../../../Mezzi/Components/detection-graph/detection-graph.component";
import { NoteSectionComponent } from "../../note-section/note-section.component";
import { SessionHystoriesComponent } from "../session-hystories/session-hystories.component";
import { MatTooltipModule } from '@angular/material/tooltip';
import { AnomaliesComponent } from "../anomalies/anomalies.component";


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
    MatTooltipModule,
    DetectionGraphComponent,
    NoteSectionComponent,
    SessionHystoriesComponent,
    AnomaliesComponent
],
  templateUrl: './dettaglio-mezzo.component.html',
  styleUrl: './dettaglio-mezzo.component.css'
})
export class DettaglioMezzoComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();

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
    private notesService: NotesService,
    private authService: AuthService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ) {}

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
  }

  private fetchVehicle(): void {
    this.vehiclesApiService.getVehicleByVeId(this.veId).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehicle: Vehicle) => {
          this.vehicle = vehicle;
          this.sessionStorageService.setItem("detail", JSON.stringify(this.vehicle));
          this.cd.detectChanges();
          this.fetchVehicleNote();
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
          this.notesService.refreshNoteOptions$.next();
          this.cd.detectChanges();
        }
      },
      error: error => console.error("Errore nella ricerca della nota del veicolo: ", error)
    });
  }

  goBack(): void {
    this.router.navigate(['/home-mezzi']); // Consider using a dynamic return path if necessary
    this.sessionStorageService.removeItem("detail");
  }
}
