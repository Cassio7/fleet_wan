import { Component, EventEmitter, inject, Input, model, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatSliderModule} from '@angular/material/slider';
import { MapService } from '../../../Common-services/map/map.service';
import { range, Subject, takeUntil } from 'rxjs';
import { Point } from '../../../Models/Point';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { openSnackbar } from '../../../Utils/snackbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VehicleRangeKm } from '@interfaces2/VehicleRangeKm.interface';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-point-research',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatNativeDateModule,
    MatDatepickerModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatSliderModule
  ],
  templateUrl: './point-research.component.html',
  styleUrl: './point-research.component.css'
})
export class PointResearchComponent implements OnChanges, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  snackbar: MatSnackBar = inject(MatSnackBar);

  searchForm!: FormGroup;
  @Input() point!: Point;
  @Output() rangeChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() searchResults: EventEmitter<VehicleRangeKm[]> = new EventEmitter<VehicleRangeKm[]>();
  loading: boolean = false;

  visiblePlates = model(false); //valore collegato con parent

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
    private mapService: MapService
  ){
    this.searchForm = new FormGroup({
      dateRange: new FormGroup({
        start: new FormControl<Date | null>(null, Validators.required),
        end: new FormControl<Date | null>(null, Validators.required),
      }),
      lat: new FormControl(0, Validators.required),
      lng: new FormControl(0, Validators.required),
      kmRange: new FormControl(0.1), //0.1km
      visiblePlates: new FormControl(false)
    });

    this.searchForm.get("kmRange")?.valueChanges.pipe(takeUntil(this.destroy$))
    .subscribe((value: number) => {
      this.rangeChange.emit(value * 1000); //emissione valore convertito in metri
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['point'] && this.point){
      this.searchForm.get('lat')?.setValue(this.point.lat);
      this.searchForm.get('lng')?.setValue(this.point.long);
      this.searchForm.get('kmRange')?.setValue(0.1);
    }

  }


  search() {
    if(this.searchForm.valid){
      this.loading = true;
      const { dateRange, kmRange } = this.searchForm.value;
      const { start, end } = dateRange;
      this.mapService.findSessionsInPoint(this.point.lat, this.point.long, kmRange, start, end)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: VehicleRangeKm[]) => {
          console.log("Search response:", response);
          this.loading = false;
          this.searchResults.emit(response);
          openSnackbar(this.snackbar,"Ricerca completata!");
        },
        error: error => {
          console.error("Errore nella ricerca delle sessioni passate per un punto: ", error);
        }
      });
    }
  }

  togglePlates(){
    this.visiblePlates.set(!this.visiblePlates())
    this.mapService.togglePopups$.next(this.visiblePlates());
  }
}
