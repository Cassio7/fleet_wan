import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../Common-services/auth/auth.service';
import { CheckErrorsService } from '../../../../Common-services/check-errors/check-errors.service';
import { NavigationService } from '../../../../Common-services/navigation/navigation.service';
import { NotesService } from '../../../../Common-services/notes/notes.service';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { SvgService } from '../../../../Common-services/svg/svg.service';
import { VehiclesApiService } from '../../../../Common-services/vehicles api service/vehicles-api.service';
import { Note } from '../../../../Models/Note';
import { Stats } from '../../../../Models/Stats';
import { User } from '../../../../Models/User';
import { Vehicle } from '../../../../Models/Vehicle';
import { calulatePercentage } from '../../../../Utils/Percentage';
import { NoteSectionComponent } from '../../../note-section/note-section.component';
import { SessionFiltersComponent } from '../../../session-filters/session-filters.component';
import { SessionTableComponent } from '../../../session-table/session-table.component';
import { AnomaliesComponent } from '../anomalies/anomalies.component';
import { DetectionGraphComponent } from '../detection-graph/detection-graph.component';

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
    AnomaliesComponent,
    SessionFiltersComponent,
    SessionTableComponent,
  ],
  templateUrl: './dettaglio-mezzo.component.html',
  styleUrl: './dettaglio-mezzo.component.css',
})
export class DettaglioMezzoComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();

  private veId!: number;
  user!: User;
  vehicle!: Vehicle;
  stats!: Stats;
  previous_url: string | null = '/dashboard';
  goBack_text: string = 'Torna alla dashboard';
  dataUpdate = signal(0); //per notificare la session table di aggiornare i propri dati

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    public svgService: SvgService,
    private router: Router,
    private route: ActivatedRoute,
    private vehiclesApiService: VehiclesApiService,
    private notesService: NotesService,
    private authService: AuthService,
    private navigationService: NavigationService,
    private sessionStorageService: SessionStorageService,
    private checkErrorsService: CheckErrorsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.previous_url = this.navigationService.getPreviousUrl();

    this.vehicle = JSON.parse(this.sessionStorageService.getItem('detail'));
    this.user = this.authService.getParsedAccessToken();
    if (!this.vehicle) {
      this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
        this.veId = parseInt(params['id']);
        this.fetchVehicle();
      });
      this.checkErrorsService
        .getStatsByVeId(this.veId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats: Stats) => {
            this.stats = stats;
          },
        });
    } else {
      this.checkErrorsService
        .getStatsByVeId(this.vehicle.veId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats: Stats) => {
            this.stats = stats;
          },
        });
    }
    if (this.previous_url) {
      this.sessionStorageService.setItem('previous_url', this.previous_url);
    } else if (this.sessionStorageService.getItem('previous_url')) {
      this.previous_url = this.sessionStorageService.getItem('previous_url');
    }

    if(this.previous_url)
    this.goBack_text = this.navigationService.getGoBackTextByUrl(this.previous_url);

    this.cd.detectChanges();
  }

  private fetchVehicle(): void {
    this.vehiclesApiService
      .getVehicleByVeId(this.veId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehicle: Vehicle) => {
          this.vehicle = vehicle;
          this.sessionStorageService.setItem(
            'detail',
            JSON.stringify(this.vehicle)
          );
          this.cd.detectChanges();
          this.fetchVehicleNote();
        },
        error: (error) => {
          console.error('Errore nella ricerca del veicolo: ', error);
        },
      });
  }

  private fetchVehicleNote() {
    this.notesService
      .getNoteByVeId(this.vehicle.veId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (note: Note) => {
          if (note) {
            this.vehicle.note = note;
            this.sessionStorageService.setItem(
              'detail',
              JSON.stringify(this.vehicle)
            );
            this.notesService.loadNote$.next();
            this.cd.detectChanges();
          }
        },
        error: (error) =>
          console.error('Errore nella ricerca della nota del veicolo: ', error),
      });
  }

  goBack(): void {
    this.router.navigate([this.previous_url || '/dashboard']);
    this.sessionStorageService.removeItem('detail');
  }

  calculatePercentage(part: number){
    return calulatePercentage(this.stats.num_anomaly, part);
  }

  updateData(){
    this.dataUpdate.update(v => v + 1);
  }
}
