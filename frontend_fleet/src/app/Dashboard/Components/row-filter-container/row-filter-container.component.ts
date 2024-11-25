import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-row-filter-container',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatOptionModule,
    ReactiveFormsModule,
  ],
  templateUrl: './row-filter-container.component.html',
  styleUrl: './row-filter-container.component.css'
})
export class RowFilterContainerComponent {
  filterForm!: FormGroup;
  listaCantieri: string[] = ['Seleziona tutto', 'Bastia Umbra', 'Todi', 'Umbertide', 'Capranica', 'Perugia', 'Ronciglione', 'Monserrato', 'Sorso', 'Sennori'];
  cantieri = new FormControl<string[]>([]);
  allSelected: boolean = false;

  constructor(){
    this.filterForm = new FormGroup({
      cantiere: new FormControl(''),
      targa: new FormControl(''),
      range: new FormGroup({
        start: new FormControl(new Date()),
        end: new FormControl(new Date())
      })
    });
  }
  /**
 * Viene chiamata alla premuta di un qualsiasi checkbox dentro il select per il filtro
 * @param option
 */
  selectCantiere(option: string){
    if(option === "Seleziona tutto" && !this.allSelected){
      this.cantieri.setValue(this.listaCantieri);
      this.allSelected = true;
    }else if(option === "Seleziona tutto" && this.allSelected){
      this.cantieri.setValue([]);
      this.allSelected = false;
    }
  }
}
