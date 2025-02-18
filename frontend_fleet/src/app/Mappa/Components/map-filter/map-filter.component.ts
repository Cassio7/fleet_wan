import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { CantieriFilterService } from '../../../Common-services/cantieri-filter/cantieri-filter.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-filter',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatIconModule,
    MatOptionModule,
    MatSlideToggleModule
  ],
  templateUrl: './map-filter.component.html',
  styleUrl: './map-filter.component.css'
})
export class MapFilterComponent {
  plate: string = "";
  cantieri = new FormControl<string[]>([]);
  listaCantieri: string[] = [];
  checked = false;
  disabled = false;
  private allSelected: boolean = false;

  private _filters: Filters = {
    plate: this.plate,
    cantieri: this.cantieri,
    gps: new FormControl(null),
    antenna: new FormControl(null),
    sessione: new FormControl(null)
  };

  constructor(
    private cantieriFilterService: CantieriFilterService,
    private filtersCommonService: FiltersCommonService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}

  selectAll(){
    const cantieriToggle = this.cantieriFilterService.toggleSelectAllCantieri(this.allSelected, );
    console.log(cantieriToggle);
    this.cantieri.setValue(cantieriToggle.length > 0 ? ["Seleziona tutto", ...cantieriToggle] : cantieriToggle);
    this.allSelected = !this.allSelected;
    this.cd.detectChanges();
    this.filtersCommonService.applyFilters$.next(this.filters);
  }

  selectCantiere(){
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    const allCantieri = this.cantieriFilterService.vehiclesCantieriOnce(allVehicles);

    const selectedCantieri = this.cantieri.value?.filter(option => option !== "Seleziona tutto");
    if(selectedCantieri){
      if(JSON.stringify(allCantieri.sort()) == JSON.stringify(selectedCantieri.sort())){
        this.allSelected = true
        this.cantieri.setValue(["Seleziona tutto", ...allCantieri]);
      }else{
        this.allSelected = false;
        this.cantieri.setValue(selectedCantieri);
      }
    }
    this.filtersCommonService.applyFilters$.next(this.filters);
  }

  searchPlates(){
    this.filters.plate = this.plate;
    this.filtersCommonService.applyFilters$.next(this.filters);
  }

  public get filters(): Filters {
    return this._filters;
  }
  public set filters(value: Filters) {
    this._filters = value;
  }
}
