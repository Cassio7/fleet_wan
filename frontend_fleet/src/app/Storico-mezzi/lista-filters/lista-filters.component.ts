import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-lista-filters',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './lista-filters.component.html',
  styleUrl: './lista-filters.component.css'
})
export class ListaFiltersComponent {
  plate: string = "";
  listaCantieri: string[] = [];
  cantieri = new FormControl<string[]>([]);

  selectCantiere(cantiere: string){

  }

  searchPlates(){

  }
}
