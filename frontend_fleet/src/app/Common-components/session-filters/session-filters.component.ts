import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SessionApiService } from '../../Common-services/session/session-api.service';
import { TagService } from '../../Common-services/tag/tag.service';

@Component({
  selector: 'app-session-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule
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

      this.sessionApiService.loadAnomalySessionDays$.next(dateRange);
    }
  }

}
