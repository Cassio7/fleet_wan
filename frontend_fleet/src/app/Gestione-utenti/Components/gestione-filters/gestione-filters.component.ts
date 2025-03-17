import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-gestione-filters',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    MatDividerModule,
    ReactiveFormsModule
  ],
  templateUrl: './gestione-filters.component.html',
  styleUrl: './gestione-filters.component.css'
})
export class GestioneFiltersComponent {
  userFiltersForm!: FormGroup;

  rolesSelectOpened: boolean = false;

  listUtenti: string[] = [];

  constructor(){
    this.userFiltersForm = new FormGroup({
      utente: new FormControl(''),
      roles: new FormControl('')
    });
  }

  selectAll(){

  }

  selectRole(){

  }

  searchUser(){

  }
}
