import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { Company } from '../../../Models/Company';
import { GestioneSocietaService } from '../../Services/gestione-societa/gestione-societa.service';

@Component({
  selector: 'app-societa-filters',
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
  templateUrl: './societa-filters.component.html',
  styleUrl: './societa-filters.component.css'
})
export class SocietaFiltersComponent {
  private readonly destroy$: Subject<void> = new Subject<void>();
  @Input() societa!: Company[];
  societaFiltersForm!: FormGroup;

  societaSelectOpened: boolean = false;

  listaSocieta: string[] = [];

  allSelected: boolean = false;

  constructor(
    public gestioneSocietaService: GestioneSocietaService
  ){
    this.societaFiltersForm = new FormGroup({
      societa: new FormControl('')
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['societa']){
      this.listaSocieta = this.societa.map(cantiere => cantiere.name);
      this.societaFiltersForm.get('societa')?.setValue(["Seleziona tutto", ...this.listaSocieta]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.listaSocieta = this.societa.map(cantiere => cantiere.name);
    this.gestioneSocietaService.societaFilter.set(this.listaSocieta);

    this.societaFiltersForm.get('societa')?.setValue(["Seleziona tutto", ...this.listaSocieta]);
    this.allSelected = true;

    this.societaFiltersForm.valueChanges.pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.gestioneSocietaService.societaFilter.set(this.societaFiltersForm.get('societa')?.value || [])
    });
  }

  selectAll(){
    if(this.allSelected){
      this.societaFiltersForm.get('societa')?.setValue([]);
      this.allSelected = false;
    }else{
      this.societaFiltersForm.get('societa')?.setValue(["Seleziona tutto", ...this.listaSocieta]);
      this.allSelected = true;
    }
  }
}
