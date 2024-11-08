import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavbarComponent } from "../navbar/navbar.component";
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { VehiclesApiService } from '../../services/vehicles service/vehicles-api.service';
import { Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../models/Vehicle';
import { Session } from '../../models/Session';
import { SessionApiService } from '../../services/session service/session-api.service';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}


@Component({
  selector: 'app-broken-vehicles-page',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatSelectModule
  ],
  templateUrl: './broken-vehicles-page.component.html',
  styleUrl: './broken-vehicles-page.component.css',
  encapsulation: ViewEncapsulation.None
})
export class BrokenVehiclesPageComponent implements OnDestroy, AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  filterForm!: FormGroup;
  startDate!: Date;
  endDate!: Date;
  sessions!: Session[];

  cantieri: string[] = [];
  plates: string[] = [];

  constructor(
    private sessionApiService: SessionApiService,
    private cd: ChangeDetectorRef
  ) {
    this.filterForm = new FormGroup({
      cantiere: new FormControl(''),
      targa: new FormControl(''),
      range: new FormGroup({
        start: new FormControl(new Date()),
        end: new FormControl(new Date())
      })
    });
  }

  ngAfterViewInit(): void {

  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  displayedColumns: string[] = ['comune', 'targa', 'data', 'allestimento', 'GPS', 'antenna', 'sessione', 'notes'];


  toppings = new FormControl('');

  toppingList: string[] = ['Extra cheese', 'Mushroom', 'Onion', 'Pepperoni', 'Sausage', 'Tomato'];

  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });


  filterFormSubmit(){
    const start_date = this.filterForm.get('range.start')?.value;
    const end_date = this.filterForm.get('range.end')?.value;

    if (start_date && end_date) {
      this.sessionApiService.getAllSessionsRanged(start_date, end_date).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions: Session[]) => {
          console.log(`SESSIONI TRA ${start_date} A ${end_date}`);
          console.log(sessions);
        },
        error: error => console.error(error)
      });
    }
  }

  // //Riempi array di cantieri
  // fillCantieriArray(){
  //   this.vehicles.forEach(vehicle => {
  //     this.cantieri.push();
  //   });
  //   this.cd.detectChanges();
  // }

  // //Riempi array di targhe
  // fillPlatesArray(){
  //   this.vehicles.forEach(vehicle => {
  //     this.plates.push(vehicle.plate);
  //   });
  //   this.cd.detectChanges();
  // }
}
