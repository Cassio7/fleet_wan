import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SessionApiService } from '../../Common-services/session/session-api.service';
import { TagService } from '../../Common-services/tag/tag.service';

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
@Component({
  selector: 'app-session-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'it-IT' },
  ],
  templateUrl: './session-filters.component.html',
  styleUrl: './session-filters.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SessionFiltersComponent implements OnInit{
  constructor(
    private sessionApiService: SessionApiService,
    private tagService: TagService
  ){}

  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  ngOnInit(): void {
    this.range.valueChanges.subscribe(() => {
      this.checkDateRange();
    });
  }

  /**
   * Controlla se il valore del datapicker
   * presenta una data di inizio e di fine
   */
  checkDateRange() {
    const startDate = this.range.get('start')?.value;
    const endDate = this.range.get('end')?.value;

    this.tagService.dateFrom.set(startDate || null);
    this.tagService.dateTo.set(endDate || null);

    if (startDate && endDate) {
      const dateRange: Date[] = [startDate, endDate];

      console.log("Selezionate entrambe le date:", startDate, endDate);

      this.sessionApiService.loadAnomalySessionDays$.next(dateRange);
    }
  }

}
