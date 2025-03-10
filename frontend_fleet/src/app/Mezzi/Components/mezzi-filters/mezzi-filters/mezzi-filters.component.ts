import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CantieriFilterService } from '../../../../Common-services/cantieri-filter/cantieri-filter.service';
import { MatSelectModule } from '@angular/material/select';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { VehicleData } from '../../../../Models/VehicleData';
import { PlateFilterService } from '../../../../Common-services/plate-filter/plate-filter.service';
import { NotesService } from '../../../../Common-services/notes/notes.service';
import { Note } from '../../../../Models/Note';
import { Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../../../Models/Vehicle';
import { MezziFiltersService } from '../../../Services/mezzi-filters/mezzi-filters.service';
import { Filters, FiltersCommonService } from '../../../../Common-services/filters-common/filters-common.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-mezzi-filters',
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
  templateUrl: './mezzi-filters.component.html',
  styleUrl: './mezzi-filters.component.css',
})
export class MezziFiltersComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  private allSelected: boolean = false;
  plate: string = "";
  cantieri = new FormControl<string[]>([]);
  listaCantieri: string[] = [];

  cantieriSelectOpened: boolean = false;

  private filters: Filters = {
    plate: this.plate,
    cantieri: this.cantieri,
    gps: new FormControl(null),
    antenna: new FormControl(null),
    sessione: new FormControl(null)
  }

  constructor(
    public cantieriFilterService: CantieriFilterService,
    private plateFilterService: PlateFilterService,
    private notesService: NotesService,
    private filtersCommonService: FiltersCommonService,
    private mezziFilterService: MezziFiltersService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    const storedData = this.sessionStorageService.getItem("allVehicles");
    if (storedData) {
      const allData: VehicleData[] = JSON.parse(storedData);

      const allCantieri = this.cantieriFilterService.vehiclesCantieriOnce(allData);
      this.listaCantieri = allCantieri;
      this.cantieri.setValue(["Seleziona tutto", ...this.cantieriFilterService.vehiclesCantieriOnce(allData)]);
      this.cd.detectChanges();
    }
  }

  selectAll(){
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    const cantieriToggle = this.cantieriFilterService.toggleSelectAllCantieri(allVehicles, this.allSelected);
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

  /**
   * Resetta tutte le selezioni
   */
  resetSelections(){
    this.mezziFilterService.filterTable$.next([]); //svuotamento tabella
    const allVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    //reimpostazione della riga dei filtri
    const allCantieri = this.cantieriFilterService.vehiclesCantieriOnce(allVehicles);
    this.cantieri.setValue(["Seleziona tutto", ...allCantieri]);
    this.plate = "";
    this.cd.detectChanges();
    //reimpostazione dei filtri sugli header della tabella
    setTimeout(() => {
      //recupero di tutte le note dal db
      this.notesService.getAllNotes().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes: Note[]) => {
          const mergedVehicles: Vehicle[] = this.notesService.mergeVehiclesWithNotes(allVehicles, notes);
          this.plate = "";
          this.mezziFilterService.mezziFilters.plate = this.plate;
          this.mezziFilterService.filterTable$.next(mergedVehicles);
          this.cd.detectChanges();
        },
      });
    }, 1000);
  }
}
