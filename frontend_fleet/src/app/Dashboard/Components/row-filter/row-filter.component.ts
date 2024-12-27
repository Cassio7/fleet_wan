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

  constructor(
    private plateFilterService: PlateFilterService,
    public cantieriFilterService: CantieriFilterService,
    private gpsFilterService: GpsFilterService,
    private antennaFilterService: AntennaFilterService,
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
      this.toggleSelectAllCantieri();
      this.toggleSelectAllGps();
      this.toggleSelectAllAntenne();
    });
    this.cantieriFilterService.setCantieriSessionStorage();

    //sottoscrizione a subject per aggiornare la lista dei cantieri
    this.cantieriFilterService.updateCantieriFilterOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicles: any[]) => {
        this.cantieriFilterService.updateListaCantieri(vehicles);
      }
    });

    this.cd.detectChanges();
  }

  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro dei cantieri
   * @param option opzione selezionata
   */
  selectCantiere(option: string) {
    if(option=="Seleziona tutto"){
      this.toggleSelectAllCantieri();
    }else{
      const selectedCantieri = this.cantieri.value; //opzioni selezionate

      if(this.cantieriFilterService.isCantieriAllSelected()) {
        this.cantieriFilterService.allSelected = false;
      }
      this.cantieriFilterService.setCantieriSessionStorage();
      //se sono stati selezionati cantieri, invio dati
      if (selectedCantieri) {
        this.cantieriFilterService.filterTableByCantiere$.next(selectedCantieri);
      }
      this.cd.detectChanges();
    }
  }

  /**
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro dei gps
   * @param option opzione selezionata
   */
  selectGps(option: string) {
    if(option=="Seleziona tutto"){
      this.toggleSelectAllGps();
    }else{
      const selectedGpsStates = this.gps.value; //opzioni selezionate

      if(this.gpsFilterService.isGpsFilterAllSelected()) {
        this.gpsFilterService.allSelected = false;
      }
      //se è stato selezionato uno stato gps
      if (selectedGpsStates) {
        this.gpsFilterService.filterTableByGps$.next(selectedGpsStates);
      }
      this.cd.detectChanges();
    }
  }

  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  selectAntenna(option: string) {
    if(option=="Seleziona tutto"){
      console.log
      this.toggleSelectAllAntenne();
    }else{
      const selectedAntenne = this.antenne.value; //opzioni selezionate

      if(this.antennaFilterService.isAntennaFilterAllSelected()) {
        this.antennaFilterService.allSelected = false;
      }
      //se è stato selezionato uno stato gps
      if (selectedAntenne) {
        this.antennaFilterService.filterTableByAntenna$.next(selectedAntenne);
      }
      this.cd.detectChanges();
    }
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAllCantieri() {
    this.cantieri.setValue(this.cantieriFilterService.toggleSelectAllCantieri());
  }

  /**
   * Seleziona tutti i filtri del select dei gps
   */
  toggleSelectAllGps() {
    if(this.gpsFilterService.toggleSelectAllGps() == "all"){
      this.gps.setValue(["Seleziona tutto", "Funzionante", "Warning", "Errore"]);
    }else{
      this.gps.setValue([]);
    }
  }

  /**
   * Seleziona tutti i filtri del select delle antenne
   */
  toggleSelectAllAntenne(){
    if(this.antennaFilterService.toggleSelectAllAntenne() == "all"){
      this.antenne.setValue(["Seleziona tutto", "Blackbox", "Blackbox+antenna"]);
    }else{
      this.antenne.setValue([]);
    }
  }

  // onFilterChange(){
  //   this.cantieriFilterService.setCantieriSessionStorage();
  // }

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
