import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SessionStorageService } from '../../../Common services/sessionStorage/session-storage.service';
import { FilterService } from '../../Services/filter/filter.service';
import { skip, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-row-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatOptionModule,
    ReactiveFormsModule,
  ],
  templateUrl: './row-filter.component.html',
  styleUrl: './row-filter.component.css'
})
export class RowFilterComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  filterForm!: FormGroup;
  listaCantieri: string[] = ["Seleziona tutto"];
  cantieri = new FormControl<string[]>([]);
  allSelected: boolean = false;

  constructor(
    private filterService: FilterService,
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
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles") || "[]");

    setTimeout(() => this.selectAll());

    this.filterService.updateFilterOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicles: any[]) => {
        this.updateListaCantieri(vehicles);
      }
    });

    this.updateListaCantieri(allVehicles);
  }

  private updateListaCantieri(allVehicles: any[]): void {
    if (Array.isArray(allVehicles)) {
      this.listaCantieri = [this.listaCantieri[0], ...this.fillSelect(allVehicles)];
      this.cd.detectChanges();
    } else {
      console.error("allVehicles non è un array valido:", allVehicles);
    }
  }


  /**
 * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro
 * @param option opzione selezionata
 */
  selectCantiere(option: string) {
    if (option === "Seleziona tutto") {
      this.selectAll();  // Seleziona tutti i cantieri
    } else if (this.allSelected) {
      const updatedCantieri = this.cantieri.value?.filter(cantiere => cantiere !== "Seleziona tutto");
      this.cantieri.setValue(updatedCantieri || null);
      this.allSelected = false;
    }


    const selectedCantieri = this.cantieri.value; // Opzioni selezionate
    // Se sono stati selezionati cantieri, invia dati
    if (selectedCantieri) {
      this.filterService.filterTableByCantiere$.next(selectedCantieri);
    }
  }

  /**
   * Seleziona tutti i filtri del select
   */
  private selectAll() {
    if (!this.allSelected) { //Non era già tutto selezionato
      this.cantieri.setValue(this.listaCantieri);
      this.allSelected = true;
    } else { //Era già tutto selezionato
      this.cantieri.setValue([]);
      this.allSelected = false;
    }
  }

  /**
   * Inizializza il select per i filtri con i nomi di cantieri a cui i veicoli sono assegnati presi una sola volta
   * @returns array di nomi di cantieri
   */
  private fillSelect(vehicles: any[]){
    return vehicles ? this.filterService.fillSelect(vehicles) : [];
  }

}
