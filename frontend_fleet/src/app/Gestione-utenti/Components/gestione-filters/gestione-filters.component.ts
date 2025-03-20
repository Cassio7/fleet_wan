import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { User } from '../../../Models/User';
import { GestioneFilters, GestioneService } from '../../Services/gestione/gestione.service';

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
export class GestioneFiltersComponent implements AfterViewInit{
  @Input() users!: User[];
  userFiltersForm!: FormGroup;

  rolesSelectOpened: boolean = false;

  listaRuoli: string[] = [];

  allSelected: boolean = false;

  private filters: GestioneFilters = {
    usernameResearch: "",
    selectedRoles: []
  }

  constructor(
    private gestioneService: GestioneService
  ){
    this.userFiltersForm = new FormGroup({
      username: new FormControl(''),
      roles: new FormControl('')
    });
  }

  ngAfterViewInit(): void {
    this.filters = {
      usernameResearch: "",
      selectedRoles: this.listaRuoli
    }
    this.gestioneService.filterUsers$.next(this.filters);
    this.listaRuoli = [...new Set(this.users.map(user => user.role))];

    this.userFiltersForm.get('roles')?.setValue(["Seleziona tutto", ...this.listaRuoli]);
    this.allSelected = true;

    this.userFiltersForm.valueChanges.subscribe(changes => {
      console.log('changed!');
      this.filters = {
        usernameResearch: this.userFiltersForm.get('username')?.value,
        selectedRoles: this.userFiltersForm.get('roles')?.value
      }
      this.gestioneService.filterUsers$.next(this.filters);
    });
  }

  selectAll(){
    if(this.allSelected){
      this.userFiltersForm.get('roles')?.setValue([]);
      this.allSelected = false;
    }else{
      this.userFiltersForm.get('roles')?.setValue(["Seleziona tutto", ...this.listaRuoli]);
      this.allSelected = true;
    }
  }
}
