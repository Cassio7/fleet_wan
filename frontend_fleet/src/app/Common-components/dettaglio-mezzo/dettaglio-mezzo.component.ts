import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';
import { VehicleData } from '../../Models/VehicleData';
import { VehiclesApiService } from '../../Common-services/vehicles api service/vehicles-api.service';
import { Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../Models/Vehicle';


@Component({
  selector: 'app-dettaglio-mezzo',
  standalone: true,
  imports: [
    MatIconModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatButtonModule
  ],
  templateUrl: './dettaglio-mezzo.component.html',
  styleUrl: './dettaglio-mezzo.component.css'
})
export class DettaglioMezzoComponent implements OnInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  private veId!: number;
  vehicle!: Vehicle; // Assuming Vehicle is a proper interface or class

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private vehiclesApiService: VehiclesApiService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.veId = +params['id']; // Using unary plus to convert to number
      this.fetchVehicle();
    });
  }

  private fetchVehicle(): void {
    console.log("CHIAMATA!");
    this.vehiclesApiService.getVehicleByVeId(2954).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehicle: Vehicle) => {
          this.vehicle = vehicle;
          console.log("vhiecle: ", vehicle);
          this.cd.detectChanges();
        },
        error: (error) => {
          console.error("Errore nella ricerca del veicolo: ", error);
          this.handleErrors(error); // Method for user-friendly error messages
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/home-mezzi']); // Consider using a dynamic return path if necessary
  }

  private handleErrors(error: any): void {
    // Implement user-friendly error handling
    // e.g., display an error message in the UI
  }
}
