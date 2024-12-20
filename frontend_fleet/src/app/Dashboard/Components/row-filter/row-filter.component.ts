import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { FilterService } from '../../../Common-services/filter/filter.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-row-filter',
  standalone: true,
  imports: [
    CommonModule,
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
  listaCantieri: string[] = ["Seleziona tutto"];
  cantieri = new FormControl<string[]>([]);

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
    //seleziona tutto
    setTimeout(() => this.selectAll());
    this.setCantieriSessionStorage();

    //sottoscrizione a subject per aggiornare la lista dei cantieri
    this.filterService.updateFilterOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicles: any[]) => {
        this.updateListaCantieri(vehicles);
      }
    });

    this.cd.detectChanges();
  }

  private updateListaCantieri(vehicles: any[]): void {
    if (Array.isArray(vehicles)) {
      this.listaCantieri = [this.listaCantieri[0], ...this.fillSelect(vehicles)];
      this.cantieri.setValue(this.listaCantieri);
      this.setCantieriSessionStorage();
      this.cd.detectChanges();
    } else {
      console.error("allVehicles non è un array valido:", vehicles);
    }
  }


  /**
 * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro
 * @param option opzione selezionata
 */
  selectCantiere(option: string) {
    //se è stata premuto "Seleziona tutto" e non è tutto selezionato
    if (option === "Seleziona tutto" && !this.filterService.allSelected) {
      this.selectAll();  // Seleziona tutti i cantieri
    }else if(option == "Seleziona tutto" && this.filterService.allSelected){
      this.cantieri.setValue([]);
      this.filterService.allSelected = false;
    }

    const selectedCantieri = this.cantieri.value; // Opzioni selezionate

    //se è stata premuta un'opzione diversa da "Seleziona tutto" ed è tutto selezionato
    if(option !== "Seleziona tutto" && this.filterService.allSelected) {
      const updatedCantieri = this.cantieri.value?.filter(cantiere => cantiere !== "Seleziona tutto"); //Rimozione "seleziona tutto" se viene deselezionato qualcosa mentre è attivo "seleziona tutto"
      this.cantieri.setValue(updatedCantieri || null);
      this.filterService.allSelected = false;
    }

    this.setCantieriSessionStorage();
    // Se sono stati selezionati cantieri, invio dati
    if (selectedCantieri) {
      this.filterService.filterTableByCantiere$.next(selectedCantieri);
    }
    this.cd.detectChanges();
  }

  /**
   * Seleziona tutti i filtri del select
   */
  private selectAll() {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles") || "[]");
    if (!this.filterService.allSelected) { //Non era già tutto selezionato
      this.updateListaCantieri(allVehicles);
      this.setCantieriSessionStorage();
      this.filterService.allSelected = true;
    } else { //Era già tutto selezionato
      this.updateListaCantieri([]);
      this.setCantieriSessionStorage();
      this.filterService.allSelected = false;
    }
  }

  onFilterChange(){
    this.setCantieriSessionStorage();
  }

  /**
   * Inizializza il select per i filtri con i nomi di cantieri a cui i veicoli sono assegnati presi una sola volta
   * @returns array di nomi di cantieri
   */
  private fillSelect(vehicles: any[]){
    return vehicles ? this.filterService.fillSelect(vehicles) : [];
  }

  private setCantieriSessionStorage(){
    this.sessionStorageService.setItem("cantieri", JSON.stringify(this.listaCantieri));
  }
}
