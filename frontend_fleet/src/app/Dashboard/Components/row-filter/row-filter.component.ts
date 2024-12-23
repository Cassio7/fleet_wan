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

  constructor(
    private plateFilterService: PlateFilterService,
    public cantieriFilterService: CantieriFilterService,
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
   * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro
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
   * Seleziona tutti i filtri del select dei cantieri
   */
  toggleSelectAllCantieri() {
    this.cantieri.setValue(this.cantieriFilterService.toggleSelectAllCantieri());
  }

  // onFilterChange(){
  //   this.cantieriFilterService.setCantieriSessionStorage();
  // }

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
