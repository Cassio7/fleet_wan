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
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { MatDividerModule } from '@angular/material/divider';

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
  listaCantieri: string[] = [];
  cantieri = new FormControl<string[]>([]);
  private allSelected: boolean = false;

  cantieriSelectOpened: boolean = false;

  private _filters: Filters = {
    plate: "",
    cantieri: this.cantieri,
    gps: new FormControl(null),
    antenna: new FormControl(null),
    sessione: new FormControl(null),
    societa: new FormControl(null)
  };

  constructor(
    private filtersCommonService: FiltersCommonService,
    private cantieriFilterService: CantieriFilterService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    let allCantieri: string[] = [];
    if(allVehicles) allCantieri = this.cantieriFilterService.vehiclesCantieriOnce(allVehicles);
    this.listaCantieri = allCantieri;
    this.cantieri.setValue(["Seleziona tutto", ...allCantieri]);
    this.allSelected = !this.allSelected;
    this.cd.detectChanges();
  }

  selectAll(){
    const allData = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    const cantieriToggle = this.cantieriFilterService.toggleSelectAllCantieri(allData, this.allSelected);
    this.cantieri.setValue(cantieriToggle.length > 0 ? ["Seleziona tutto", ...cantieriToggle] : cantieriToggle);
    this.allSelected = !this.allSelected;
    this.cd.detectChanges();
    this.filtersCommonService.applyFilters$.next(this.filters);
  }


  selectCantiere(){
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    const allCantieri = this.cantieriFilterService.vehiclesCantieriOnce(allVehicles).sort();
    const selectedCantieri = this.cantieri.value?.filter(option => option !== "Seleziona tutto").sort();

    if(selectedCantieri && JSON.stringify(allCantieri) == JSON.stringify(selectedCantieri)){
      selectedCantieri.push("Seleziona tutto");
      this.allSelected = true;
    }else{
      this.allSelected = false;
    }

    this.cantieri.setValue(selectedCantieri || []);
    this.filtersCommonService.applyFilters$.next(this.filters);
  }

  searchPlates(){
    this.filtersCommonService.applyFilters$.next(this.filters);
  }


  public get filters(): Filters {
    return this._filters;
  }
  public set filters(value: Filters) {
    this._filters = value;
  }
}
