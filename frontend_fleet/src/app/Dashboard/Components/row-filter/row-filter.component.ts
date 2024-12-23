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
import { Vehicle } from '../../../Models/Vehicle';
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
  listaCantieri: string[] = ["Seleziona tutto"];
  plate: string = "";
  cantieri = new FormControl<string[]>([]);

  constructor(
    private filterService: FilterService,
    private cantieriFilterService: CantieriFilterService,
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
    this.cantieriFilterService.updateCantieriFilterOptions$
    .pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicles: any[]) => {
        this.updateListaCantieri(vehicles);
      }
    });

    this.cd.detectChanges();
  }

  /**
   * Aggiorna la lista dei cantieri con i veicoli passati
   * @param vehicles veicoli
   */
  private updateListaCantieri(vehicles: any[]): void {
    if (Array.isArray(vehicles)) {
      this.listaCantieri = [this.listaCantieri[0], ...this.fillSelect(vehicles)];
      this.cantieri.setValue(this.listaCantieri);
      this.setCantieriSessionStorage();
      this.cd.detectChanges();
    } else {
      console.error("array di veicoli non valido:", vehicles);
    }
  }

  /**
   * Invia il subject per il filtro dei veicoli in base alla ricerca sulla targa passandogli il valore del campo di ricerca
   */
  searchPlates(){
    this.filterService.filterByPlateResearch$.next(this.plate);
  }


  /**
 * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro
 * @param option opzione selezionata
 */
  selectCantiere(option: string) {
    //se è stata premuto "Seleziona tutto" e non è tutto selezionato
    if (option === "Seleziona tutto" && !this.cantieriFilterService.allSelected) {
      this.selectAll();  // Seleziona tutti i cantieri
    }else if(option == "Seleziona tutto" && this.cantieriFilterService.allSelected){
      this.cantieri.setValue([]);
      this.cantieriFilterService.allSelected = false;
    }

    const selectedCantieri = this.cantieri.value; // Opzioni selezionate

    //se è stata premuta un'opzione diversa da "Seleziona tutto" ed è tutto selezionato
    if(option !== "Seleziona tutto" && this.cantieriFilterService.allSelected) {
      const updatedCantieri = this.cantieri.value?.filter(cantiere => cantiere !== "Seleziona tutto"); //Rimozione "seleziona tutto" se viene deselezionato qualcosa mentre è attivo "seleziona tutto"
      this.cantieri.setValue(updatedCantieri || null);
      this.cantieriFilterService.allSelected = false;
    }

    this.setCantieriSessionStorage();
    // Se sono stati selezionati cantieri, invio dati
    if (selectedCantieri) {
      this.cantieriFilterService.filterTableByCantiere$.next(selectedCantieri);
    }
    this.cd.detectChanges();
  }

  /**
   * Seleziona tutti i filtri del select dei cantieri
   */
  private selectAll() {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles") || "[]");
    if (!this.cantieriFilterService.allSelected) { //Non era già tutto selezionato
      this.updateListaCantieri(allVehicles);
      this.setCantieriSessionStorage();
      this.cantieriFilterService.allSelected = true;
    } else { //Era già tutto selezionato
      this.updateListaCantieri([]);
      this.setCantieriSessionStorage();
      this.cantieriFilterService.allSelected = false;
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
    return vehicles ? this.cantieriFilterService.fillCantieriSelect(vehicles) : [];
  }

  private setCantieriSessionStorage(){
    this.sessionStorageService.setItem("cantieri", JSON.stringify(this.listaCantieri));
  }
}
