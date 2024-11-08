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

  vehicles: Vehicle[] = [];
  cantieri: string[] = [];
  plates: string[] = [];

  constructor(
    private vehiclesApiService: VehiclesApiService,
    private cd: ChangeDetectorRef
  ){
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
    //Get all vehicles data from API
    this.vehiclesApiService.getAllVehicles().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        this.vehicles = vehicles;
        this.fillPlatesArray();
      },
      error: error => console.error(`Errore nel recupero di tutti i veicoli: ${error}`)
    });

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
    this.vehiclesApiService.getVehicleByPlate("ALR 191").pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicle: Vehicle) => {
        console.log(vehicle);
      },
      error: error => console.error(`Error fetching the vehicle: ${error}`)
    })
  }

  //Riempi array di cantieri
  fillCantieriArray(){
    this.vehicles.forEach(vehicle => {
      this.cantieri.push();
    });
    this.cd.detectChanges();
  }

  //Riempi array di targhe
  fillPlatesArray(){
    this.vehicles.forEach(vehicle => {
      this.plates.push(vehicle.plate);
    });
    this.cd.detectChanges();
  }
}
