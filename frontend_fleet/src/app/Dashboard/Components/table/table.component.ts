import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Session } from '../../../Models/Session';
import { Subject, takeUntil } from 'rxjs';
import { SessionApiService } from '../../Services/session service/session-api.service';
import { VehiclesApiService } from '../../Services/vehicles service/vehicles-api.service';
import { Vehicle } from '../../../Models/Vehicle';
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
  antennaError: boolean = false;
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
    this.fillTable(); //Riempi la tabella
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
    this.vehicleApiService.checkErrorsAllToday().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: any) => {
        console.log(vehicles);
        const newVehicles = []; // Array per raccogliere i nuovi veicoli

        // Filtro e accumulo i veicoli che hanno sessioni
        for (const v of vehicles) {
          if (v.sessions?.length > 0) {
            newVehicles.push(v); // Aggiungi il veicolo valido all'array
          }
        }

        // Se ci sono nuovi veicoli, aggiorna la tabella
        if (newVehicles.length > 0) {
          this.vehicleTableData.data = [...this.vehicleTableData.data, ...newVehicles]; // Aggiungi i nuovi veicoli
          this.vehicleTable.renderRows(); // Esegui il rendering una sola volta
          this.cd.markForCheck(); // Assicurati che Angular aggiorni il DOM
        }
      },
      error: error => console.error(error),
    });

  }

  checkGpsError(vehicle: any): string | null {
    // Find the GPS anomaly
    const gpsAnomaly = vehicle.sessions?.[0]?.anomalies?.find((anomaly: any) => 'GPS' in anomaly);

    if (gpsAnomaly) {
      // Return the GPS value or a fallback message
      return gpsAnomaly.GPS || 'Errore GPS';
    }

    return null; // Return null if no GPS anomaly is found
  }

  checkAntennaError(vehicle: any){
    // Find the GPS anomaly
    return vehicle.sessions?.[0]?.anomalies?.find((anomaly: any) => 'antenna' in anomaly);
  }
}
