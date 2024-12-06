import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { MatTableModule, MatTableDataSource, MatTable } from '@angular/material/table';
import { Vehicle } from '../../../Models/Vehicle';
import { VehiclesApiService } from '../../../Common-services/vehicles service/vehicles-api.service';
import { Subject, takeUntil, filter } from 'rxjs';
import { Session } from '../../../Models/Session';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { SelectService } from '../../Services/select/select.service';
import { MezziFilterService } from '../../Services/mezzi-filter/mezzi-filter.service';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatMenuModule,
    CommonModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    MatTableModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent implements AfterViewInit, AfterViewChecked, OnDestroy{
  @ViewChild('vehicleTable') vehicleTable!: MatTable<Session[]>;
  private readonly destroy$: Subject<void> = new Subject<void>();
  allVehicles: any[] = [];

  vehicleTableData = new MatTableDataSource<Vehicle>();

  displayedColumns: string[] = ["Azienda", "Targa", "Marca&modello", "Cantiere", "Anno immatricolazione", "Tipologia attrezzatura", "Allestimento", "Data-installazione-fleet", "Data-rimozione-apparato", "Notes"];

  constructor(
    public selectService: SelectService,
    private vehicleApiService: VehiclesApiService,
    private mezziFilterService: MezziFilterService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewChecked(): void {
    this.cd.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    //riempimento dati della tabella con sessionstorage se presente oppure fare una chiamata
    this.allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    if(this.allVehicles){
      this.vehicleTableData.data = this.allVehicles;
      this.vehicleTable.renderRows();
      this.cd.detectChanges();
    }else{
      this.fillTable();
      this.cd.detectChanges();
    }
    this.selectService.selectAll(this.allVehicles); //seleziona tutte le opzioni dei menu delle colonne
  }

  /**
   * Esegue una chiamata tramite un servizio all'api per ottenere tutti i veicoli
   * e poi riempe la tabella con i dati raccolti
   */
  fillTable(){
    this.vehicleApiService.getAllVehicles().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        this.vehicleTableData.data = vehicles;
        this.sessionStorageService.setItem("allVehicles", JSON.stringify(vehicles));
        this.vehicleTable.renderRows();
      },
      error: error => console.error("Errore nella ricezione di tutti i veicoli: ", error)
    });
  }

  /**
   * Viene chiamata quando si preme su un checkbox dentro il menù della colonna "Targa"
   * @param plate targa corrispondente al checkbox premuto
   * @param $event evento
   */
  selectTarga(plate: string, $event: any){
    this.selectService.preventSelectClosing($event); //permette al menu di non chiudersi dopo aver selezionato un opzione
    this.selectService.updatePlateSelection(plate); //aggiunge una targa all'array di targhe selezionate
    this.vehicleTableData.data = this.mezziFilterService.filterVehiclesBySelections(this.selectService.selectedData, this.allVehicles); //aggiorna tabella
  }

  selectModel(model: string, $event: any){
    this.selectService.preventSelectClosing($event);
    this.selectService.updateModelSelection(model);
    this.vehicleTableData.data = this.mezziFilterService.filterVehiclesBySelections(this.selectService.selectedData, this.allVehicles);
  }

  /**
   * Viene chiamata quando si preme sul checkbox "Seleziona tutto" di una qualsiasi colonna
   * @param column colonna a cui appartiene il menu dove si trova il checkbox
   * @param $event evento
   */
  selectDeselectAllColumnOptions(column: string, $event: any){
    this.vehicleTableData.data = this.selectService.selectDeselectAllColumnOptions(column, this.allVehicles, $event);
    this.vehicleTable.renderRows();
  }

  filterVehiclesModelsDuplicates(){
    return this.mezziFilterService.filterVehiclesModelsDuplicates(this.allVehicles);
  }
}
