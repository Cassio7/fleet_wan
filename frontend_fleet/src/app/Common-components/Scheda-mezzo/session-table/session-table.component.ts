import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SessionApiService } from '../../../Common-services/session/session-api.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { VehicleAnomalies } from '../../../Models/VehicleAnomalies';
import { Vehicle } from '../../../Models/Vehicle';
import { Anomaly } from '../../../Models/Anomaly';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Session } from '../../../Models/Session';

@Component({
  selector: 'app-session-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule
  ],
  templateUrl: './session-table.component.html',
  styleUrl: './session-table.component.css',
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class SessionTableComponent implements OnChanges, AfterViewInit {
  private readonly destroy$: Subject<void> = new Subject<void>();
  @ViewChild('anomaliesTable') anomaliesTable!: MatTable<Anomaly>;
  @ViewChild('sessionsTable') sessionsTable!: MatTable<Session>;

  @Input() vehicle!: Vehicle;
  sessionsTableData = new MatTableDataSource<Session>();
  anomaliesTableData = new MatTableDataSource<Anomaly>();

  daysColumnsToDisplay = ['Data', 'Stato GPS', 'Stato Antenna', 'Sessione'];
  daysColumnsToDisplayWithExpand = ['expand', ...this.daysColumnsToDisplay];
  expandedDay: any;

  sessionColumnsToDisplay = ['Id', 'Sequence ID', 'Inizio', 'Fine', 'Distanza'];

  dateSelected: boolean = false;
  data: boolean = true;
  lastDateFrom!: Date;
  lastDateTo!: Date;

  constructor(
    private sessionApiService: SessionApiService,
    public checkErrorsService: CheckErrorsService,
    private cd: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    //caricamento dati tramite sottoscrizione a cambiamenti nel range di date
    this.sessionApiService.loadAnomalySessionDays$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (range: Date[]) => {
        if(range){
          this.lastDateFrom = range[0];
          this.lastDateTo = range[1];
          this.fillTable(this.lastDateFrom, this.lastDateTo);
        }
      },
      error: error => console.error("Errore nella notifica per il caricamento delle anomalie per giornata: ", error)
    });
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
      console.warn("Errore: Nessun dato valido ricevuto per il range di date.");
      return;
    }

    this.dateSelected = true;
    this.lastDateFrom = dateFrom;
    this.lastDateTo = dateTo;

    this.sessionApiService.getDaysAnomaliesRangedByVeid(this.vehicle.veId, this.lastDateFrom, this.lastDateTo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vehicleAnomalies: VehicleAnomalies) => {
          console.log("Anomalie per il range di date: ", vehicleAnomalies);

          if (vehicleAnomalies && vehicleAnomalies.anomalies.length > 0) {
            this.data = true;
            this.cd.detectChanges();
            this.anomaliesTableData.data = vehicleAnomalies.anomalies;
            this.anomaliesTable.renderRows();
          } else {
            this.data = false;
            this.anomaliesTableData.data = [];
            this.anomaliesTable.renderRows();
          }
        },
        error: (error) => console.error("Errore nel caricamento delle anomalie nel range di date: ", error)
      });
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
      this.handleGetSessionsByVeIdRanged(anomaly.date);
    }
  }

  /**
   * Gestisce la chiamata API che permette di recuperare le sessioni eseguite in una giornata
   * @param date data della giornata di cui prendere le sessioni
   */
  private handleGetSessionsByVeIdRanged(date: Date): void {
    const dateTo = new Date(date);
    dateTo.setDate(dateTo.getDate() + 1);

    this.sessionApiService.getSessionsByVeIdRanged(this.vehicle.veId, date, dateTo)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sessions: Session[]) => {
          this.sessionsTableData.data = sessions;
          this.sessionsTable.renderRows();
          this.cd.detectChanges();
        },
        error: error => console.error("Errore durante la ricerca delle sessioni del veicolo nell'arco di tempo: ", error)
      });
  }
}
