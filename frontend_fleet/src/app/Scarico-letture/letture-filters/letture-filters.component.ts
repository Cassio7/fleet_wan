import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { WorkSite } from '../../Models/Worksite';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { LettureFilters, LettureFilterService } from '../Services/letture-filter/letture-filter.service';

@Component({
  selector: 'app-letture-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './letture-filters.component.html',
  styleUrl: './letture-filters.component.css'
})
export class LettureFiltersComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  lettureFilterForm: FormGroup;
  @Input() cantieri: WorkSite[] = [];
  private lettureFilters!: LettureFilters;

  constructor(
    private lettureFilterService: LettureFilterService
  ){
    this.lettureFilterForm = new FormGroup({
      worksite: new FormControl([]),
      dateFrom: new FormControl(),
      dateTo: new FormControl()
    });
  }

  ngAfterViewInit(): void {
    this.lettureFilterForm.valueChanges.pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.lettureFilters = this.lettureFilterForm.value;
    });
  }

  applyFilters(){
    this.lettureFilterService.filterByLettureFilters$.next(this.lettureFilters);
  }
}
