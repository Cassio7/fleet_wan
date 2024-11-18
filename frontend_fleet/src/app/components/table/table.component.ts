import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Session } from '../../models/Session';
import { Subject, takeUntil } from 'rxjs';
import { SessionApiService } from '../../services/session service/session-api.service';
import { VehiclesApiService } from '../../services/vehicles service/vehicles-api.service';
import { Vehicle } from '../../models/Vehicle';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatTooltipModule,
    MatCheckboxModule,
  ],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements OnDestroy, AfterViewInit{
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;
  filterForm!: FormGroup;
  private readonly destroy$: Subject<void> = new Subject<void>();

  /*da rimuovere*/
  antennaError: boolean = true;
  sessionError: boolean = false;

  vehicleTableData = new MatTableDataSource<Session>();  // Use MatTableDataSource for the table

  sessions: Session[] = [];
  vehicleIds: Number[] = [];

  displayedColumns: string[] = ['comune', 'targa', 'GPS', 'antenna', 'sessione'];

  cantieri = new FormControl<string[]>([]);
  listaCantieri: string[] = ['Seleziona tutto', 'Deseleziona tutto', 'Bastia Umbra', 'Todi', 'Umbertide', 'Capranica', 'Perugia', 'Ronciglione', 'Monserrato', 'Sorso', 'Sennori'];

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  constructor(
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
        //Inserire nella tabella soltanto i dati di una sessione di ciascun veicolo
        this.sessions.forEach(session => {
          if(!this.vehicleIds.includes(session.history[0].vehicle.veId) && !this.vehicleTableData.data.includes(session)){
            this.vehicleIds.push(session.history[0].vehicle.veId);
            this.vehicleTableData.data.push(session);
          }
        });
        this.vehicleTable.renderRows();
        this.cd.markForCheck();
      }
    });
  }
  // fillTable(){
  //   this.vehicleApiService.checkGPSAllToday().pipe(takeUntil(this.destroy$))
  //   .subscribe({
  //     next: (vehicles: Vehicle[]) => {
  //     }
  //   })
  // }


  /**
 * Controlla anomalie dei veicoli nelle sessioni
 * @param sessions
 */
  // checkErrors(sessions: Session[]) {
  //   //controlla errore di GPS
  //   sessions.forEach(session => {
  //     console.log(session.history[0].vehicle.veId);
  //     this.vehicleApiService.checkGPSessionByVeid(session.history[0].vehicle.veId).pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (response: any) => {
  //         response ? session.history[0].vehicle.gpsError = false : session.history[0].vehicle.gpsError = true;
  //       },
  //       error: error => console.error("Errore nella visualizzazione del controllo sui GPS: ", error)
  //     });
  //   });
  //   //controlla errore antenna

  //   //controlla errore inizio e fine sessione (last event)
  // }
  checkErrors() {
    //controlla errore di GPS
    this.vehicleApiService.checkGPSAllToday().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: Vehicle[]) => {

      },
      error: error => console.error("Errore nella visualizzazione del controllo del GPS.")
    });
    //controlla errore antenna

    //controlla errore inizio e fine sessione (last event)
  }
}
