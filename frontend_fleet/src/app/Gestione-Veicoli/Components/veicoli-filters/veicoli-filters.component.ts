import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Subject, takeUntil } from 'rxjs';
import { GestioneSocietaService } from '../../../Gestione-Società/Services/gestione-societa/gestione-societa.service';
import { Company } from '../../../Models/Company';
import { Vehicle } from '../../../Models/Vehicle';

@Component({
  selector: 'app-veicoli-filters',
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
  templateUrl: './veicoli-filters.component.html',
  styleUrl: './veicoli-filters.component.css'
})
export class VeicoliFiltersComponent implements OnChanges, AfterViewInit, OnDestroy{
private readonly destroy$: Subject<void> = new Subject<void>();
  @Input() veicoli!: Vehicle[];
  veicoliFiltersForm!: FormGroup;

  societaSelectOpened: boolean = false;

  listaSocieta: string[] = [];

  allSelected: boolean = false;

  constructor(
    public gestioneSocietaService: GestioneSocietaService
  ){
    this.veicoliFiltersForm = new FormGroup({
      targa: new FormControl(''),
      cantieri: new FormControl([]),
      societa: new FormControl([])
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // if(changes['societa']){
    //   this.listaSocieta = this.veicoli.map(cantiere => cantiere.name);
    //   this.societaFiltersForm.get('societa')?.setValue(["Seleziona tutto", ...this.listaSocieta]);
    // }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // this.listaSocieta = this.societa.map(cantiere => cantiere.name);
    // this.gestioneSocietaService.societaFilter.set(this.listaSocieta);

    this.veicoliFiltersForm.get('societa')?.setValue(["Seleziona tutto", ...this.listaSocieta]);
    this.allSelected = true;

    this.veicoliFiltersForm.valueChanges.pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.gestioneSocietaService.societaFilter.set(this.veicoliFiltersForm.get('veicoli')?.value || [])
    });
  }

  selectAll(){
    if(this.allSelected){
      this.veicoliFiltersForm.get('veicoli')?.setValue([]);
      this.allSelected = false;
    }else{
      this.veicoliFiltersForm.get('veicoli')?.setValue(["Seleziona tutto", ...this.listaSocieta]);
      this.allSelected = true;
    }
  }
}
