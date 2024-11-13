import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDrawer, MatDrawerContainer } from '@angular/material/sidenav';
import { MatTableModule, MatTableDataSource, MatTable } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, timestamp } from 'rxjs';
import { History } from '../../models/History';
import { Session } from '../../models/Session';
import { CommonService } from '../../services/common service/common.service';
import { SessionApiService } from '../../services/session service/session-api.service';
import { VehiclesApiService } from '../../services/vehicles service/vehicles-api.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Vehicle } from '../../models/Vehicle';
import { ErrorGraphComponent } from "../error-graph/error-graph.component";
import { BlackboxGraphComponent } from "../blackbox-graph/blackbox-graph.component";

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
    MatCheckboxModule,
    RouterModule,
    ErrorGraphComponent,
    BlackboxGraphComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit, OnDestroy{
  @ViewChild('drawer') sidebar!: MatDrawer;
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;
  showFiller: boolean = false;
  private readonly destroy$: Subject<void> = new Subject<void>();

  filterForm!: FormGroup;
  startDate!: Date;
  endDate!: Date;

  /*da rimuovere*/
  antennaError: boolean = false;
  sessionError: boolean = false;

  vehicleTableData = new MatTableDataSource<Session>();  // Use MatTableDataSource for the table
  private readonly _formBuilder = inject(FormBuilder);

  sessions: Session[] = [];
  vehicleIds: Number[] = [];

  displayedColumns: string[] = ['comune', 'targa', 'GPS', 'antenna', 'sessione'];

  cantieri = new FormControl<string[]>([]);
  listaCantieri: string[] = ['Seleziona tutto', 'Deseleziona tutto', 'Extra cheese', 'Mushroom', 'Onion', 'Pepperoni', 'Sausage', 'Tomato'];

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

  ngOnDestroy(): void {
   this.destroy$.next();
   this.destroy$.complete();
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

  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro
   * @param option
   */
  selectCantiere(option: string){
    if(option === "Seleziona tutto"){
      this.cantieri.setValue(this.listaCantieri);
    }else if(option == "Deseleziona tutto"){
      this.cantieri.setValue([]);
    }
    //Applica filtro sulla tabella
    // this.cantieri.value()
  }

  /**
   * Riempe la tabella con i dati dei veicoli nelle sessioni
   */
  fillTable(){
    this.sessionApiService.getTodaySessions().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (sessions: Session[]) => {
        this.sessions = sessions;
        //Inserire nella tabella soltanto i dati dei veicoli
        this.sessions.forEach(session => {
          console.log("RUNNING...");
          if(!this.vehicleIds.includes(session.history[0].vehicle.veId) && !this.vehicleTableData.data.includes(session)){
            this.vehicleIds.push(session.history[0].vehicle.veId);
            this.vehicleTableData.data.push(session);
          }
        });
        this.vehicleTable.renderRows();
        this.checkErrors(this.vehicleTableData.data);//controllo errori

        this.cd.detectChanges();
      }
    });
  }

  filter(){

  }

  /**
   * Controlla anomalie dei veicoli nelle sessioni
   * @param sessions
   */
  checkErrors(sessions: Session[]) {
      //controlla errore di GPS
      sessions.forEach(session => {
        console.log(session.history[0].vehicle.veId);
        this.vehicleApiService.checkGPSessionByVeid(session.history[0].vehicle.veId).pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: boolean) => {
            response ? session.history[0].vehicle.gpsError = false : session.history[0].vehicle.gpsError = true;
          },
          error: error => console.error("Errore nella visualizzazione del controllo sui GPS: ", error)
        });
      });
      //controlla errore antenna

      //controlla errore inizio e fine sessione (last event)
  }
}
