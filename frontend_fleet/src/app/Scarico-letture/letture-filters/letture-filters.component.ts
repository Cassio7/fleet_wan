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
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatTooltipModule,
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
      cantieriNames: new FormControl([]),
      dateFrom: new FormControl(),
      dateTo: new FormControl()
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['cantieri']){
      this.listaCantieri = this.cantieri.map(cantiere => cantiere.name);
      this.lettureFilterForm.get('cantieriNames')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
      this.allSelected = true;
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
      this.lettureFilterForm.get('cantieriNames')?.setValue([]);
      this.allSelected = false;
    }else{
      this.lettureFilterForm.get('cantieriNames')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
      this.allSelected = true;
    }
  }

  getApplyFilterTooltip(): string {
    const dateFrom = this.lettureFilterForm.get('dateFrom');
    const dateTo = this.lettureFilterForm.get('dateTo');
    const cantieriNames = this.lettureFilterForm.get('cantieriNames');

    if (!dateFrom?.touched || !dateTo?.touched) {
      return 'Selezionare un range di date completo';
    }

    if (!cantieriNames?.value || cantieriNames.value.length === 0) {
      return 'Selezionare almeno un cantiere';
    }

    return '';
  }

  isApplyFilterEnabled(): boolean {
    const dateFrom = this.lettureFilterForm.get('dateFrom');
    const dateTo = this.lettureFilterForm.get('dateTo');
    const cantieriNames = this.lettureFilterForm.get('cantieriNames');

    return dateFrom?.touched &&
           dateTo?.touched &&
           dateFrom.value &&
           dateTo.value &&
           cantieriNames?.value &&
           cantieriNames.value.length > 0;
  }
}
