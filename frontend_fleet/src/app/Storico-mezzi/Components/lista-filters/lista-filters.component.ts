import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { MatDividerModule } from '@angular/material/divider';
import { Vehicle } from '../../../Models/Vehicle';

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
    MatDividerModule,
    MatOptionModule
  ],
  templateUrl: './lista-filters.component.html',
  styleUrl: './lista-filters.component.css'
})
export class ListaFiltersComponent implements AfterViewInit{
  plate: string = "";
  listaCantieri: string[] = [];
  cantieri = new FormControl<string[]>([]);
  private allSelected: boolean = false;

  private filters: Filters = {
    plate: this.plate,
    cantieri: this.cantieri,
    gps: new FormControl(null),
    antenna: new FormControl(null),
    sessione: new FormControl(null)
  }

  constructor(
    private filtersCommonService: FiltersCommonService,
    private cantieriFilterService: CantieriFilterService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    const allCantieri = this.cantieriFilterService.vehiclesCantieriOnce(allVehicles);
    this.listaCantieri = allCantieri;
    this.cantieri.setValue(["Seleziona tutto", ...allCantieri]);
    this.allSelected = !this.allSelected;
    this.cd.detectChanges();
  }

  selectAll(){
    this.allSelected = !this.allSelected;
    const cantieriToggle = this.cantieriFilterService.toggleSelectAllCantieri(this.allSelected);
    this.cantieri.setValue(cantieriToggle);
    this.cd.detectChanges();
    this.filtersCommonService.applyFilters$.next(this.filters);
  }

  selectCantiere(){
    this.filters.plate = this.plate;
    this.filtersCommonService.applyFilters$.next(this.filters);
  }

  searchPlates(){
    this.filters.plate = this.plate;
    this.filtersCommonService.applyFilters$.next(this.filters);
  }
}
