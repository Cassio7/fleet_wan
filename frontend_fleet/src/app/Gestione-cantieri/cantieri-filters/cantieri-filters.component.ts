import { GestioneCantieriService } from './../Services/gestione-cantieri/gestione-cantieri.service';
import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { WorkSite } from '../../Models/Worksite';
import { FormGroup, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-cantieri-filters',
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
  templateUrl: './cantieri-filters.component.html',
  styleUrl: './cantieri-filters.component.css'
})
export class CantieriFiltersComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @Input() cantieri!: WorkSite[];
  userFiltersForm!: FormGroup;

  cantieriSelectOpened: boolean = false;

  listaCantieri: string[] = [];

  allSelected: boolean = false;

  constructor(
    public gestioneCantieriService: GestioneCantieriService
  ){
    this.userFiltersForm = new FormGroup({
      cantieri: new FormControl('')
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.listaCantieri = this.cantieri.map(cantiere => cantiere.name);
    this.gestioneCantieriService.cantieriFilter.set(this.listaCantieri);

    this.userFiltersForm.get('cantieri')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
    this.allSelected = true;

    this.userFiltersForm.valueChanges.pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.gestioneCantieriService.cantieriFilter.set(this.userFiltersForm.get('cantieri')?.value || [])
    });
  }

  selectAll(){
    if(this.allSelected){
      this.userFiltersForm.get('cantieri')?.setValue([]);
      this.allSelected = false;
    }else{
      this.userFiltersForm.get('cantieri')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
      this.allSelected = true;
    }
  }
}
