import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource, MatTable } from '@angular/material/table';
import { Vehicle } from '../../../Models/Vehicle';
import { VehiclesApiService } from '../../../Common-services/vehicles service/vehicles-api.service';
import { Subject, takeUntil } from 'rxjs';
import { Session } from '../../../Models/Session';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MatInputModule,
    MatCheckboxModule,
    MatTableModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements AfterViewInit, OnDestroy{
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;
  private readonly destroy$: Subject<void> = new Subject<void>();
  allVehicles: Vehicle[] = [];

  vehicleTableData = new MatTableDataSource<Vehicle>();


  displayedColumns: string[] = ["Azienda", "Targa", "Marca e modello", "Cantiere", "Anno immatricolazione", "Tipologia attrezzatura", "Allestimento", "Data installazione fleet", "Data rimozione apparato", "Notes"];

  constructor(
    private vehicleService: VehiclesApiService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectColor($event:any) {
    // this stops the menu from closing
    $event.stopPropagation();
    $event.preventDefault();

    // in this case, the check box is controlled by adding the .selected class
    if($event.target) {
      $event.target.classList.toggle('selected');
    }

    // add additional selection logic here.

  }
  ngAfterViewInit(): void {
    this.allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    if(this.allVehicles){
      this.vehicleTableData.data = this.allVehicles;
      this.vehicleTable.renderRows();
      this.cd.detectChanges();
    }else{
      this.fillTable();
      this.cd.detectChanges();
    }
  }

  fillTable(){
    this.vehicleService.getAllVehicles().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        this.vehicleTableData.data = vehicles;
        this.sessionStorageService.setItem("allVehicles", JSON.stringify(vehicles));
        this.vehicleTable.renderRows();
      },
      error: error => console.error("Errore nella ricezione di tutti i veicoli: ", error)
    });
  }

  selectVehicle($event: any){
    $event.stopPropagation();
    $event.preventDefault();
  }

}
