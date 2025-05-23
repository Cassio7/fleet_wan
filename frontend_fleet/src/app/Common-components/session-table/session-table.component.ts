import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Signal,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  MatTable,
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { catchError, Observable, of, skip, Subject, takeUntil } from 'rxjs';
import { CheckErrorsService, VehicleAnomalies } from '../../Common-services/check-errors/check-errors.service';
import { MapService, pathData } from '../../Common-services/map/map.service';
import { SessionApiService } from '../../Common-services/session/session-api.service';
import { SessionStorageService } from '../../Common-services/sessionStorage/session-storage.service';
import { tagData, TagService } from '../../Common-services/tag/tag.service';
import { Anomaly } from '../../Models/Anomaly';
import { Point } from '../../Models/Point';
import { Session } from '../../Models/Session';
import { Vehicle } from '../../Models/Vehicle';

@Component({
  selector: 'app-session-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './session-table.component.html',
  styleUrl: './session-table.component.css',
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({ height: '0px', minHeight: '0', visibility: 'hidden' })
      ),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class SessionTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('anomaliesTable') anomaliesTable!: MatTable<Anomaly>;
  @ViewChild('sessionsTable') sessionsTable!: MatTable<Session>;

  @Input() vehicle!: Vehicle;
  @Input() dataUpdate!: Signal<number>; //per ascoltare evento di aggiornare i dati proveniente dal parent component

  sessionsTableData = new MatTableDataSource<Session>();
  anomaliesTableData = new MatTableDataSource<Anomaly>();

  allSessions: Session[] = [];

  // Define ALL possible columns
  allDaysColumns: string[] = [
    'expand',
    'Data',
    'Stato GPS',
    'Stato Antenna',
    'Sessione',
    'Map',
  ];
  allSessionColumns: string[] = [
    'Id',
    'Sequence ID',
    'Inizio',
    'Fine',
    'Distanza',
    'Map',
  ];

  // These are the displayed columns - they will be updated
  displayedDaysColumns: string[] = [];
  displayedSessionColumns: string[] = [];

  expandedDay: any;

  isDettaglio: boolean = false;
  dateSelected: boolean = false;
  dataFound: boolean = true; //indica se sono state trovate sessioni un determinato periodo di tempo del veicolo selezionato
  updating: boolean = false; //indica se i dati stanno venendo aggiornati

  lastDateFrom!: Date;
  lastDateTo!: Date;

  constructor(
    private sessionApiService: SessionApiService,
    public checkErrorsService: CheckErrorsService,
    private mapService: MapService,
    private sessionStorageService: SessionStorageService,
    private tagService: TagService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
    effect(() => {
      if(this.dataUpdate){
        const updateNumber = this.dataUpdate(); //per triggerare l'effect
        this.updateData();
      }
    });
  }

  private updateData(){
    this.anomaliesTableData.data = [];
    this.updating = true;
    this.cd.detectChanges();

    if(this.lastDateFrom  && this.lastDateTo){
      this.sessionApiService.updateSessionAnomalies(this.vehicle.veId, this.lastDateFrom, this.lastDateTo).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { message: string }) => {
          this.updating = false;
          this.fillTable(this.lastDateFrom, this.lastDateTo);
        },
        error: error => console.error("Errore nell'aggiornamento delle anomalie: ", error)
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    // Initialize displayed columns with ALL columns
    this.displayedDaysColumns = [...this.allDaysColumns];
    this.displayedSessionColumns = [...this.allSessionColumns];
  }

  ngAfterViewInit(): void {
    this.checkDettaglio();

    //caricamento dati tramite sottoscrizione a cambiamenti nel range di date
    this.sessionApiService.loadAnomalySessionDays$
      .pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (range: Date[]) => {
          if (range) {
            this.lastDateFrom = range[0];
            this.lastDateTo = range[1];
            this.fillTable(this.lastDateFrom, this.lastDateTo);
          }
        },
        error: (error) =>
          console.error(
            'Errore nella notifica per il caricamento delle anomalie per giornata: ',
            error
          ),
      });
  }

  private checkDettaglio() {
    const currentRoute = this.router.url;
    this.isDettaglio = currentRoute.startsWith('/dettaglio-mezzo');

    if (this.isDettaglio) {
      // Filter the DISPLAYED columns
      this.displayedDaysColumns = this.allDaysColumns.filter(
        (col) => col !== 'Map'
      );
      this.displayedSessionColumns = this.allSessionColumns.filter(
        (col) => col !== 'Map'
      );
    } else {
      // Add to DISPLAYED columns if not already there
      if (!this.displayedDaysColumns.includes('Map')) {
        this.displayedDaysColumns.push('Map');
      }
      if (!this.displayedSessionColumns.includes('Map')) {
        this.displayedSessionColumns.push('Map');
      }
    }
    this.cd.detectChanges(); // Absolutely essential!
  }

  /**
   * Controlla quando avvengono cambiamenti solo nel veicolo preso in input,
   * e non nel range di date, caricando la tabella di conseguenza
   * @param changes cambiamenti
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicle'] && changes['vehicle'].currentValue) {
      this.fillTable(this.lastDateFrom, this.lastDateTo);
    }
  }

  /**
   * Riempe la tabella con i dati
   * @param dateFrom
   * @param dateTo
   * @returns
   */
  private fillTable(dateFrom: Date, dateTo: Date): void {
    if (!dateFrom || !dateTo || dateTo < dateFrom) {
      console.warn('Errore: Nessun dato valido ricevuto per il range di date.');
      return;
    }

    this.dateSelected = true;
    this.lastDateFrom = dateFrom;
    this.lastDateTo = dateTo;

    if(this.vehicle){
      this.sessionApiService
      .getDaysAnomaliesRangedByVeid(
        this.vehicle.veId,
        this.lastDateFrom,
        this.lastDateTo
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehicleAnomalies: VehicleAnomalies) => {

          if (vehicleAnomalies && vehicleAnomalies?.anomalies?.length > 0) {
            this.dataFound = true;
            this.cd.detectChanges();
            this.anomaliesTableData.data = vehicleAnomalies.anomalies;
            this.anomaliesTable.renderRows();
          } else {
            this.dataFound = false;
            this.anomaliesTableData.data = [];
            this.anomaliesTable.renderRows();
          }
        },
        error: (error) =>
          console.error(
            'Errore nel caricamento delle anomalie nel range di date: ',
            error
          ),
      });
    }
  }

  /**
   * Funzione chiamata quando una riga viene espansa,
   * essa richiama una funzione x una chiamata API atta a recuperare le sessioni
   * del veicolo selezionato e nella data specificata
   * @param anomaly oggetto Anomaly con data della giornata
   * @param event evento MouseEvent
   */
  handleRowExpansion(anomaly: Anomaly, event: MouseEvent): void {
    this.expandedDay = this.expandedDay === anomaly ? null : anomaly;
    event.stopPropagation();
    if (this.expandedDay) {
      this.handleGetSessionsByVeIdRanged(anomaly.date)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (sessions: Session[]) => {
            if (sessions) {
              let count = 1;

              this.allSessions = sessions;

              this.sessionsTableData.data = sessions.slice(0, 5);
            } else {
              this.allSessions = [];
              this.sessionsTableData.data = [];
            }
            this.cd.detectChanges();
          },
        });
    }else{
      this.allSessions = [];
    }
  }

  /**
   * Gestisce la chiamata API che permette di recuperare le sessioni eseguite in una giornata
   * @param date data della giornata di cui prendere le sessioni
   */
  private handleGetSessionsByVeIdRanged(date: Date): Observable<Session[]> {
    const dateTo = new Date(date);
    dateTo.setDate(dateTo.getDate() + 1);

    return this.sessionApiService
      .getSessionsByVeIdRanged(this.vehicle.veId, date, dateTo)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error fetching sessions:', error);
          return of([]); // Return an empty array Observable on error
        })
      );
  }

  /**
   * Funzione placeholder per il bottone "Carica altro"
   */
  loadMore(button: MatButton): void {
    this.sessionsTableData.data = this.allSessions;
    button._elementRef.nativeElement.style.display = 'none'; // Accessing native element correctly
  }

  /**
   * Mostra il percorso effettuato da un veicolo in una sessione nella mappa dell sezione di destra dello storico
   * @param session sessione del veicolo di cui mostrare il percorso
   * @param index indice della riga della sessione
   */
  showPathBySession(session: Session, index: number) {
    if(session) this.tagService.setTimeRange(session.period_from, session.period_to);
    const points = session.history.map((history) => {
      return new Point(history.latitude, history.longitude);
    });
    const pathData: pathData = {
      plate: this.vehicle.plate,
      position_number: index,
      points: points,
      tagPoints: []
    };

    this.tagService.getTagsByVeIdRanged(this.vehicle.veId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (tagData: tagData[]) => {
        if(tagData){
          pathData.tagPoints = tagData.map(tag => new Point(tag.latitude, tag.longitude));
        }
        this.sessionStorageService.setItem("pathData", JSON.stringify(pathData));
        this.mapService.loadSessionPath$.next(pathData);
      },
      error: error => {
        this.sessionStorageService.setItem("pathData", JSON.stringify(pathData));
        this.mapService.loadSessionPath$.next(pathData);
        console.error(`Errore nel recupero delle letture dei tag: ${error}`);
      }
    });
  }

  /**
   * Mostra il percorso effettuato da un veicolo in una sessione nella mappa dell sezione di destra dello storico
   * @param anomalyDay dati della giornata selezionata
   */
  showDayPath(anomalyDay: Anomaly) {
    if(anomalyDay.date) this.tagService.setTimeRange(anomalyDay.date, anomalyDay.date);
    this.handleGetSessionsByVeIdRanged(anomalyDay.date).subscribe(
      (sessions) => {
        if(sessions){
          const points: Point[] = sessions?.flatMap((session) =>
            session.history.map(
              (posizione) => new Point(posizione.latitude, posizione.longitude)
            )
          );

          const firstPoints: Point[] = sessions?.map((session) => {
            const firstHistory = session.history[0];
            return new Point(firstHistory.latitude, firstHistory.longitude);
          });

          const pathData: pathData = {
            plate: this.vehicle.plate,
            points: points,
            firstPoints: firstPoints,
            tagPoints: []
          };

          this.tagService.getTagsByVeIdRanged(this.vehicle.veId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (tagData: tagData[]) => {
              if(tagData){
                pathData.tagPoints = tagData.map(tag => new Point(tag.latitude, tag.longitude));
              }
              this.sessionStorageService.setItem("pathData", JSON.stringify(pathData));
              this.mapService.loadDayPath$.next(pathData);
            },
            error: error => {
              this.sessionStorageService.setItem("pathData", JSON.stringify(pathData));
              this.mapService.loadDayPath$.next(pathData);
              console.error(`Errore nel recupero delle letture dei tag: ${error}`);
            }
          });
        }
      }
    );
  }
}
