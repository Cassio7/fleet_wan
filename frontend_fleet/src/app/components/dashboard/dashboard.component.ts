import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Session } from '../../models/Session';
import { Vehicle } from '../../models/Vehicle';
import { CommonService } from '../../services/common service/common.service';
import { SessionApiService } from '../../services/session service/session-api.service';
import { VehiclesApiService } from '../../services/vehicles service/vehicles-api.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDrawer,
    MatDrawerContainer,
    NavbarComponent,
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    MatNativeDateModule,
    MatDatepickerModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  @ViewChild('drawer') sidebar!: MatDrawer;
  showFiller: boolean = false;
  private readonly destroy$: Subject<void> = new Subject<void>();

  filterForm!: FormGroup;
  startDate!: Date;
  endDate!: Date;
  gpsError: boolean = false;

  vehicleTableData = new MatTableDataSource<Session>();  // Use MatTableDataSource for the table

  sessions: Session[] = [];
  cantieri: string[] = [];
  plates: string[] = [];



  displayedColumns: string[] = ['comune', 'targa', 'GPS', 'antenna', 'sessione'];

  toppings = new FormControl('');
  toppingList: string[] = ['Extra cheese', 'Mushroom', 'Onion', 'Pepperoni', 'Sausage', 'Tomato'];

  readonly range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  constructor(
    private commonService: CommonService,
    private router: Router,
    private sessionApiService: SessionApiService,
    private vehicleApiService: VehiclesApiService,
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
    this.commonService.notifySidebar$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.sidebar.toggle();
      },
      error: () => {
        console.error("Error opening the sidebar.");
      }
    });
    this.fillTable();
  }

  fillTable(){
    this.sessionApiService.getTodaySessions().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (sessions: Session[]) => {
        this.sessions = sessions;
        this.vehicleTableData.data = this.sessions;
        this.cd.detectChanges();
      }
    });
  }
}
