import { DetectionTag } from './../../models/DetectionTag';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Session } from '../../models/Session';
import { SessionApiService } from '../../services/session service/session-api.service';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { DateAdapter, MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-broken-vehicles-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatNativeDateModule,
    MatDatepickerModule
  ],
  standalone: true,
  templateUrl: './broken-vehicles-page.component.html',
  styleUrls: ['./broken-vehicles-page.component.css']
})
export class BrokenVehiclesPageComponent implements OnDestroy, OnInit {
  private readonly destroy$: Subject<void> = new Subject<void>();

  filterForm!: FormGroup;
  startDate!: Date;
  endDate!: Date;
  gpsError: boolean = false;

  dataSource = new MatTableDataSource<Session>();  // Use MatTableDataSource for the table

  sessions: Session[] = [];
  cantieri: string[] = [];
  plates: string[] = [];



  displayedColumns: string[] = ['comune', 'targa', 'data', 'allestimento', 'GPS', 'antenna', 'sessione'];

  toppings = new FormControl('');
  toppingList: string[] = ['Extra cheese', 'Mushroom', 'Onion', 'Pepperoni', 'Sausage', 'Tomato'];

  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

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

  ngOnInit(): void {
    this.getAllVehiclesLastSession();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Recupera
   */
  filterFormSubmit() {
    const start_date = this.filterForm.get('range.start')?.value;
    const end_date = this.filterForm.get('range.end')?.value;

    if (start_date && end_date) {
      this.sessionApiService.getAllSessionsRanged(start_date, end_date)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (sessions: Session[]) => {
            this.sessions = sessions;
            this.dataSource.data = this.sessions;
            this.cd.detectChanges();
          },
          error: error => console.error(error)
        });
    }
  }

  /**
   * Prende l'ultima sessione di ogni veicolo
   */
  getAllVehiclesLastSession() {
    this.sessionApiService.getAllVehiclesLastSessions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((lastSessions: Session[]) => {
        this.sessions = lastSessions.filter(session => session !== null && session.sequence_id !== 0); // Filtra gli elementi nulli e le sessioni attive
        this.dataSource.data = this.sessions;
        this.cd.detectChanges();
      });
  }

}
