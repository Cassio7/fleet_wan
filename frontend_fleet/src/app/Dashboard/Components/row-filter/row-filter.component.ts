import { SessionFilterService } from './../../../Common-services/session-filter/session-filter.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { GpsFilterService } from '../../../Common-services/gps-filter/gps-filter.service';
import { AntennaFilterService } from '../../../Common-services/antenna-filter/antenna-filter.service';
import { Vehicle } from '../../../Models/Vehicle';
import { SortService } from '../../../Common-services/sort/sort.service';

@Component({
  selector: 'app-row-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatDividerModule,
    MatOptionModule,
    ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './row-filter.component.html',
  styleUrl: './row-filter.component.css'
})

export class RowFilterComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  filterForm!: FormGroup;
  plate: string = "";
  cantieri = new FormControl<string[]>([]);
  gps = new FormControl<string[]>([]);
  antenne = new FormControl<string[]>([]);
  sessionStates = new FormControl<string[]>([]);

  constructor(
    private plateFilterService: PlateFilterService,
    public cantieriFilterService: CantieriFilterService,
    public gpsFilterService: GpsFilterService,
    public antennaFilterService: AntennaFilterService,
    public sessionFilterService: SessionFilterService,
    private sortService: SortService,
    private cantiereFilterService: CantieriFilterService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef) {
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
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    //seleziona tutto
    setTimeout(() => {
      this.cantieriFilterService.updateListaCantieri(allVehicles);
      this.toggleSelectAll();
    });

    //sottoscrizione a subject per aggiornare la lista dei cantieri
    this.cantieriFilterService.updateCantieriFilterOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicles: any[]) => {
        this.cantieriFilterService.updateListaCantieri(vehicles);
      }
    });

    this.gpsFilterService.updateGpsFilterOptions$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (selectedOptions: string[]) => {
        this.gps.setValue(selectedOptions);
      }
    });

    this.cd.detectChanges();
  }

  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro dei cantieri
   * @param option opzione selezionata
   */
  selectCantiere(option: string) {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    const selectedCantieri = this.cantieri.value || [];

    if (option === "Seleziona tutto") {
      this.toggleSelectAll();
    } else {
      //rimozione di "Seleziona tutto" solo quando una singola opzione è deselezionata
      if (this.cantieriFilterService.isCantieriAllSelected()) {
        this.cantieriFilterService.allSelected = false;
        const updatedSelections = selectedCantieri.filter(selection => selection !== "Seleziona tutto");
        this.cantieri.setValue(updatedSelections);
      }

      const allOptions = this.cantiereFilterService.vehiclesCantieriOnce(allVehicles);
      const areAllSelected = allOptions.every(option => selectedCantieri.includes(option));

      //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
      if (areAllSelected && !selectedCantieri.includes("Seleziona tutto")) {
        selectedCantieri.unshift("Seleziona tutto");
        this.cantieri.setValue(selectedCantieri);
        this.cantieriFilterService.allSelected = true;
      }
    }


    this.cantieriFilterService.filterTableByCantiere$.next(this.cantieri.value || []); //notifica il filtro alla tabella basato sulle opzioni selezionate
    this.cd.detectChanges();
  }



  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro dei gps
   * @param option opzione selezionata
   */
  selectGps(option: string) {
    const tableData = this.sessionStorageService.getItem("tableData");
    const selectedGpsStates = this.gps.value || [];

    if (option === "Seleziona tutto") {
      this.toggleSelectAll();
    } else {
      //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
      if (this.gpsFilterService.isGpsFilterAllSelected()) {
        this.gpsFilterService.allSelected = false;
        this.gps.setValue(selectedGpsStates.filter(selection => selection !== "Seleziona tutto"));
      }

      const allOptions = ["Funzionante", "Warning", "Errore"];
      const areAllSelected = allOptions.every(option => selectedGpsStates.includes(option));

      //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
      if (areAllSelected && !selectedGpsStates.includes("Seleziona tutto")) {
        selectedGpsStates.push("Seleziona tutto");
        this.gps.setValue(selectedGpsStates);
        this.gpsFilterService.allSelected = true;
      }
    }

    this.gpsFilterService.filterTableByGps$.next(this.gps.value || []);//notifica il filtro alla tabella basato sulle opzioni selezionate
    this.cd.detectChanges();
  }


  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  selectAntenna(option: string) {
    const selectedAntenne = this.antenne.value || [];

    if (option === "Seleziona tutto") {
      this.toggleSelectAll();
    } else {
      //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
      if (this.antennaFilterService.isAntennaFilterAllSelected()) {
        this.antennaFilterService.allSelected = false;
        this.antenne.setValue(selectedAntenne.filter(selection => selection !== "Seleziona tutto"));
      }

      const allOptions = ["Funzionante", "Errore", "Blackbox"];
      const areAllSelected = allOptions.every(option => selectedAntenne.includes(option));

      //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
      if (areAllSelected && !selectedAntenne.includes("Seleziona tutto")) {
        selectedAntenne.push("Seleziona tutto");
        this.antenne.setValue(selectedAntenne);
        this.antennaFilterService.allSelected = true;
      }
    }
    this.antennaFilterService.filterTableByAntenna$.next(this.antenne.value || []); //notifica di filtrare tabella in base al filtro delle antenne
    this.cd.detectChanges();
  }

  selectSession(option: string){
    const selectedSessionStates = this.sessionStates.value || [];

    if (option === "Seleziona tutto") {
      this.toggleSelectAll();
    } else {
      //rimozione di "Seleziona tutto" quando una singola opzione è deselezionata
      if (this.sessionFilterService.isSessionFilterAllSelected()) {
        this.sessionFilterService.allSelected = false;
        this.gps.setValue(selectedSessionStates.filter(selection => selection !== "Seleziona tutto"));
      }

      const allOptions = ["Funzionante", "Warning", "Errore"];
      const areAllSelected = allOptions.every(option => selectedSessionStates.includes(option));

      //selezione di "Seleziona tutto" quando tutte le opzioni singole sono selezionate
      if (areAllSelected && !selectedSessionStates.includes("Seleziona tutto")) {
        selectedSessionStates.push("Seleziona tutto");
        this.gps.setValue(selectedSessionStates);
        this.sessionFilterService.allSelected = true;
      }
    }

    this.sessionFilterService.filterTableBySessionStates$.next(this.sessionStates.value || []);//notifica il filtro alla tabella basato sulle opzioni selezionate
    this.cd.detectChanges();
  }

  toggleSelectAllSession(){
    const toggle = this.sessionFilterService.toggleSelectAllSessionStates();
    if(toggle == "all"){
      this.sessionStates.setValue(["Seleziona tutto", ...this.sessionFilterService.allOptions]);
    }else{
      this.sessionStates.setValue([]);
    }
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAll() {
    this.cantieri.setValue(this.cantieriFilterService.toggleSelectAllCantieri());
    this.toggleSelectAllGps()
    this.toggleSelectAllAntenne();
    this.toggleSelectAllSession();
  }

  /**
   * Seleziona tutti i filtri del select dei gps
   */
  toggleSelectAllGps() {
    if(this.gpsFilterService.toggleSelectAllGps() == "all"){
      this.gps.setValue(["Seleziona tutto", ...this.gpsFilterService.allOptions]);
    }else{
      this.gps.setValue([]);
    }
  }

  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  toggleSelectAllAntenne(){
    if(this.antennaFilterService.toggleSelectAllAntenne() == "all"){
      this.antenne.setValue(["Seleziona tutto", ...this.antennaFilterService.allOptions]);
    }else{
      this.antenne.setValue([]);
    }
  }

  /**
   * Aggiorna le opzioni selezionate dei cantieri
   * @param vehicles veicoli da controllare
   */
  updateAllFiltersSelectedOptions(vehicles: Vehicle[]){
    const data = vehicles || JSON.parse(this.sessionStorageService.getItem("tableData"));
    console.log(this.sortService.sortVehiclesByCantiereDesc(data));
    this.cantieri.setValue(["Seleziona tutto", ...this.cantiereFilterService.vehiclesCantieriOnce(this.sortService.sortVehiclesByCantiereDesc(data))]);
    this.gps.setValue(["Seleziona tutto", ...this.gpsFilterService.updateSelectedOptions(data)]);
    this.antenne.setValue(["Seleziona tutto", ...this.antennaFilterService.updateSelectedOptions(data)]);
  }

  /**
   * Controlla se tutti i cantieri sono selezionati
   * @returns ritorna il risultato della funzione nel servizio
   */
  isCantieriAllSelected(): boolean {
    return this.cantieriFilterService.isCantieriAllSelected();
  }

  /**
   * Invia il subject per filtrare le targhe in base all'input inserito
   * @param emptyButtonClick se la funzione è stata chiamata dalla premuta del bottone per svuotare il campo
   */
  searchPlates(emptyButtonClick: boolean){
    if(emptyButtonClick){
      this.plateFilterService.filterByPlateResearch$.next("");
      this.plate = "";
    }else{
      this.plateFilterService.filterByPlateResearch$.next(this.plate);
    }
  }
}
