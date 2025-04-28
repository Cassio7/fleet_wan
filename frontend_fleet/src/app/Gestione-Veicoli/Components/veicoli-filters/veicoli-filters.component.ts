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
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { Vehicle } from '../../../Models/Vehicle';
import { GestioneVeicoliService } from '../../Services/gestione-veicoli.service';

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

  cantieriSelectOpened: boolean = false;
  societaSelectOpened: boolean = false;

  listaCantieri: string[] = [];
  listaSocieta: string[] = [];

  allSelected: boolean = false;

  constructor(
    public gestioneVeicoliService: GestioneVeicoliService,
    private cantieriFilterService: CantieriFilterService
  ){
    this.veicoliFiltersForm = new FormGroup({
      targa: new FormControl(''),
      cantieri: new FormControl([]),
      societa: new FormControl([])
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['veicoli']){
      if(this.veicoli.length > 0){
        this.listaCantieri = this.cantieriFilterService.vehiclesCantieriOnce(this.veicoli);
        this.listaSocieta = Array.from(
          new Set(
            this.veicoli
              .map(veicolo => veicolo.company?.name || "Libero")
              .filter(name => name !== undefined)
          )
        );

        this.veicoliFiltersForm.get('cantieri')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
        this.veicoliFiltersForm.get('societa')?.setValue(["Seleziona tutto", ...this.listaSocieta]);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {

    this.veicoliFiltersForm.get('societa')?.setValue(["Seleziona tutto", ...this.listaSocieta]);
    this.allSelected = true;

    this.veicoliFiltersForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() =>{
      this.gestioneVeicoliService.gestioneVeicoliFilters.set(this.veicoliFiltersForm.value);
    });
  }

  selectAll(){
    if(this.allSelected){
      this.veicoliFiltersForm.get('cantieri')?.setValue([]);
      this.veicoliFiltersForm.get('societa')?.setValue([]);
      this.allSelected = false;
    }else{
      this.veicoliFiltersForm.get('cantieri')?.setValue(["Seleziona tutto", ...this.listaCantieri]);
      this.veicoliFiltersForm.get('societa')?.setValue(["Seleziona tutto", ...this.listaSocieta]);
      this.allSelected = true;
    }
  }
}
