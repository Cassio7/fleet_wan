import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { SessionStorageService } from '../../../Common services/sessionStorage/session-storage.service';
import { FilterService } from '../../Services/filter/filter.service';

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
  filterForm!: FormGroup;
  listaCantieri: string[] = ['Seleziona tutto'];
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

    setTimeout(() => {
      this.selectAll();
    });

    this.listaCantieri = [this.listaCantieri, ...this.fillSelect()];
    this.cd.detectChanges();
  }

  /**
 * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro
 * @param option opzione selezionata
 */
  selectCantiere(option: string, event: any) {
    console.log("option: ", typeof option);
    console.log("lista cantieri: ", this.listaCantieri);
    if (option[0] === 'Seleziona tutto') {
      console.log("DOVREI SELEZIONA TUTTO.");
      this.selectAll();
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
  selectAll() {
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
  fillSelect(){
    let allVehicles;
    allVehicles = this.sessionStorageService.getItem("allVehicles");
    return this.filterService.fillSelect(allVehicles);
  }

}
