import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { GestioneCantieriService } from '../../../Common-services/gestione-cantieri/gestione-cantieri.service';
import { WorkSite } from '../../../Models/Worksite';

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
export class CantieriFiltersComponent implements OnChanges, AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  @Input() cantieri!: WorkSite[];
  cantieriFiltersForm!: FormGroup;

  cantieriSelectOpened: boolean = false;

  listaCantieri: string[] = [];

  allSelected: boolean = false;

  constructor(
    public gestioneCantieriService: GestioneCantieriService
  ){
    this.cantieriFiltersForm = new FormGroup({
      cantieri: new FormControl('')
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['cantieri']){
      this.listaCantieri = this.cantieri.map(cantiere => cantiere.name);
      this.cantieriFiltersForm.get('cantieri')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.listaCantieri = this.cantieri.map(cantiere => cantiere.name);
    this.gestioneCantieriService.cantieriFilter.set(this.listaCantieri);

    this.cantieriFiltersForm.get('cantieri')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
    this.allSelected = true;

    this.cantieriFiltersForm.valueChanges.pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.gestioneCantieriService.cantieriFilter.set(this.cantieriFiltersForm.get('cantieri')?.value || [])
    });
  }

  selectAll(){
    if(this.allSelected){
      this.cantieriFiltersForm.get('cantieri')?.setValue([]);
      this.allSelected = false;
    }else{
      this.cantieriFiltersForm.get('cantieri')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
      this.allSelected = true;
    }
  }
}
