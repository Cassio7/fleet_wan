import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
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
import { MatDividerModule } from '@angular/material/divider';

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
    MatButtonModule,
    MatDividerModule
  ],
  templateUrl: './letture-filters.component.html',
  styleUrl: './letture-filters.component.css'
})
export class LettureFiltersComponent implements AfterViewInit, OnChanges{
  private readonly destroy$: Subject<void> = new Subject<void>();
  allSelected: boolean = false;

  cantieriSelectOpened: boolean = false;

  lettureFilterForm: FormGroup;
  @Input() cantieri: WorkSite[] = [];
  listaCantieri: string[] = [];
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

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['cantieri']){
      this.listaCantieri = this.cantieri.map(cantiere => cantiere.name);
      this.lettureFilterForm.get('worksite')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
    }
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

  selectAll(){
    if(this.allSelected){
      this.lettureFilterForm.get('cantieri')?.setValue([]);
      this.allSelected = false;
    }else{
      this.lettureFilterForm.get('cantieri')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
      this.allSelected = true;
    }
  }
}
