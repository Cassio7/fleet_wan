import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AfterViewInit, ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
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
export class SessionTableComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  @ViewChild('anomaliesTable') anomaliesTable!: MatTable<Anomaly>;
  @Input() vehicle!: Vehicle;
  anomaliesTableData = new MatTableDataSource<Anomaly>();
  columnsToDisplay = ['Data', 'Stato GPS', 'Stato Antenna', 'Sessione'];
  columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  expandedElement: any;

  dateSelected: boolean = false;
  data: boolean = true;
  dateFrom!: Date;
  dateTo!: Date;

  constructor(
    private sessionApiService: SessionApiService,
    public checkErrorsService: CheckErrorsService,
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
    console.log("vehicle: ", this.vehicle);
    this.sessionApiService.loadAnomalySessionDays$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (range: Date[]) => {
        this.dateSelected = true;
        this.dateFrom = range[0];
        this.dateTo = range[1];

        this.cd.detectChanges();

        if(this.dateTo >= this.dateFrom){
          this.sessionApiService.getDaysAnomaliesRangedByVeid(this.vehicle.veId, this.dateFrom, this.dateTo).pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (vehicleAnomalies: VehicleAnomalies) => {
              console.log("days anomalies returned: ", vehicleAnomalies);
              if(vehicleAnomalies){
                this.data = true;
                this.cd.detectChanges();
                const anomalies: Anomaly[] = vehicleAnomalies.anomalies;

                this.anomaliesTableData.data = anomalies;
                this.anomaliesTable.renderRows();
              }else{
                this.data = false;
                this.anomaliesTableData.data = [];
                this.anomaliesTable.renderRows();
              }
            },
            error: error => console.error("Errore nel caricamento delle anomalie in un range temporale: ", error)
          });
        }
      },
      error: error => console.error("Errore nella notifica x il caricamento delle anomalie per giornata: ", error)
    });
  }
}
