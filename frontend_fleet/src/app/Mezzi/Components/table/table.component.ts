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

  vehicleTableData = new MatTableDataSource<Vehicle>();

  displayedColumns: string[] = ["Azienda", "Targa", "Marca&modello", "Cantiere", "Anno immatricolazione", "Tipologia attrezzatura", "Allestimento", "Data-installazione-fleet", "Data-rimozione-apparato", "Notes"];

  constructor(
    public selectService: SelectService,
    public mezziFilterService: MezziFilterService,
    private vehicleApiService: VehiclesApiService,
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
    this.mezziFilterService.filteredVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    if(this.mezziFilterService.filteredVehicles){
      this.vehicleTableData.data = this.mezziFilterService.filteredVehicles;
      this.vehicleTable.renderRows();
      this.cd.detectChanges();
    }else{
      this.fillTable();
      this.cd.detectChanges();
    }
    this.selectService.selectAll(this.mezziFilterService.filteredVehicles); //seleziona tutte le opzioni dei menu delle colonne
    this.cd.detectChanges();
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


  selectTarga(vehicle: Vehicle, $event: any){
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    this.selectService.updateVehiclesSelectionByPlate(allVehicles, vehicle);
    this.vehicleTableData.data = this.selectService.selectedVehicles;//aggiorna tabella
    this.onSelection($event);
  }

  selectModel(vehicle: Vehicle, $event: any){
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    this.selectService.updateVehiclesSelectionByModel(allVehicles, vehicle);
    this.vehicleTableData.data = this.selectService.selectedVehicles;
    this.onSelection($event);
  }

  selectCantiere(vehicle: Vehicle, $event: any){
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    this.selectService.updateVehiclesSelectionByCantiere(allVehicles, vehicle);
    this.vehicleTableData.data = this.selectService.selectedVehicles;
    this.onSelection($event);
  }

  private onSelection($event: any){
    $event.stopPropagation(); //impedisci al menu di chiudersi
    this.cd.detectChanges();
    this.vehicleTable.renderRows();
  }

  /**
   * Viene chiamata quando si preme sul checkbox "Seleziona tutto" di una qualsiasi colonna
   * @param column colonna a cui appartiene il menu dove si trova il checkbox
   * @param $event evento
   */
  selectDeselectAll($event: any){
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    this.vehicleTableData.data = this.selectService.selectDeselectAll(allVehicles, $event);
    this.vehicleTable.renderRows();
  }

  /**
   * richiama la funzione per rimuovere i duplicati dalla lista di modelli
   * @returns funzione nel servizio
   */
  filterVehiclesModelsDuplicates(){
    return this.mezziFilterService.filterVehiclesModelsDuplicates(this.mezziFilterService.filteredVehicles);
  }

  /**
   * richiama la funzione per rimuovere i duplicati dalla lista di cantieri
   * @returns funzione nel servizio
   */
  filterVehiclesCantieriDuplicates(){
    return this.mezziFilterService.filterVehiclesCantieriDuplicates(this.mezziFilterService.filteredVehicles);
  }

}
