import { TableService } from './../../Services/table/table.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

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
  listaCantieri: string[] = ['Seleziona tutto', 'Bastia Umbra', 'Todi', 'Umbertide', 'Capranica', 'Perugia', 'Ronciglione', 'Monserrato', 'Sorso', 'Sennori'];
  cantieri = new FormControl<string[]>([]);
  allSelected: boolean = false;

  constructor(private tableService: TableService) {
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
    // Use setTimeout to defer the change to the next cycle and prevent ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.selectCantiere('Seleziona tutto');
    });
  }

  /**
 * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro
 * @param option
 */
  selectCantiere(option: string) {
    if (option === 'Seleziona tutto') {
      if (!this.allSelected) { //Non era già tutto selezionato
        this.cantieri.setValue(this.listaCantieri);
        this.allSelected = true;
      } else { //Era già tutto selezionato
        this.cantieri.setValue([]);
        this.allSelected = false;
      }
    }else{
      this.cantieri.value?.splice(0, 1); //Rimozione "Seleziona tutto" dall'array in caso di selezione di un'altra opzione
    }

    const selectedCantieri = this.cantieri.value; //Opzioni selezionate

    //Se sono stati selezionati cantieri invia dati
    if (selectedCantieri) {
      this.tableService.filterTableByCantiere$.next(selectedCantieri);
    }
  }



}
