import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
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
import { NotesService } from '../../../Services/notes/notes.service';
import { Note } from '../../../../Models/Note';
import { Subject, takeUntil } from 'rxjs';
import { Vehicle } from '../../../../Models/Vehicle';
import { MezziFilters, MezziFiltersService } from '../../../Services/mezzi-filters/mezzi-filters.service';

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
    ReactiveFormsModule
  ],
  templateUrl: './mezzi-filters.component.html',
  styleUrl: './mezzi-filters.component.css'
})
export class MezziFiltersComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  plate: string = "";
  cantieri = new FormControl<string[]>([]);

  constructor(
    public cantieriFilterService: CantieriFilterService,
    private plateFilterService: PlateFilterService,
    private notesService: NotesService,
    private mezziFilterService: MezziFiltersService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    const storedData = this.sessionStorageService.getItem("allData");
    if (storedData) {
      const allData: VehicleData[] = JSON.parse(storedData);

      const allVehicles = allData.map((vehicleData: any) => {
        return vehicleData.vehicle;
      });

      this.cantieri.setValue(this.cantieriFilterService.updateListaCantieri(allVehicles));
    }
    this.loadFiltersObj();
  }

  selectCantiere(option: string){
    const allVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    if(option == "Seleziona tutto"){
      const cantieriToggle = this.cantieriFilterService.toggleSelectAllCantieri();
      this.cantieri.setValue(cantieriToggle);
      this.loadFiltersObj();
      const tableVehicles = cantieriToggle.length > 0 ? allVehicles : [];
      this.mezziFilterService.filterTable$.next(tableVehicles);
    }else{
      const filteredVehicles: Vehicle[] = this.mezziFilterService.filterVehicles(allVehicles);

      this.mezziFilterService.filterTable$.next(filteredVehicles);
    }
  }

  searchPlates(){
    this.mezziFilterService.mezziFilters.plate = this.plate; //aggiornamento del valore della targa nell'oggetto dei filtri
    console.log("this.mezziFilterService.mezziFilters.plate : ", this.plate);
    const allVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("allVehicles"));

    const filteredVehicles: Vehicle[] = this.mezziFilterService.filterVehicles(allVehicles);

    this.mezziFilterService.filterTable$.next(filteredVehicles);
  }

  loadFiltersObj(){
    this.mezziFilterService.mezziFilters.plate = this.plate;
    this.mezziFilterService.mezziFilters.cantieri = this.cantieri;
  }

  /**
   * Resetta tutte le selezioni
   */
  resetSelections(){
    setTimeout(() => {
      //recupero di tutte le note dal db
      this.notesService.getAllNotes().pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (notes: Note[]) => {
          const allVehicles: Vehicle[] = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
          const mergedVehicles: Vehicle[] = this.notesService.mergeVehiclesWithNotes(allVehicles, notes);
          this.mezziFilterService.filterTable$.next(mergedVehicles);
          this.cd.detectChanges();
        },
      });
    }, 1000);
  }
}
