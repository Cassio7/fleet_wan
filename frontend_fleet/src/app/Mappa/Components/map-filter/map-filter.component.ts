import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
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
import { MapService } from '../../../Common-services/map/map.service';
import { Subject, takeUntil } from 'rxjs';
import { RealtimeData } from '../../../Models/RealtimeData';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';

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
export class MapFilterComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  plate: string = "";

  targhe = new FormControl<string[]>([]);
  cantieri = new FormControl<string[]>([]);

  listaCantieri: string[] = [];
  listaTarghe: string[] = [];

  checked = true;
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
    private mapService: MapService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // this.mapService.loadPosition$.pipe(takeUntil(this.destroy$))
    // .subscribe({
    //   next: (realtimeData: RealtimeData | null) => {
    //     if(realtimeData){
    //       this.listaTarghe.push(realtimeData.vehicle.plate);
    //     }
    //     this.cd.detectChanges();
    //   },
    //   error: error => console.error("Errore nel caricamento del veicolo nel filtro: ", error)
    // });
    this.mapService.selectMarker$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (plate: string) => {

      },
      error: error => console.error("Errore nella selezione del marker: ", error)
    });
  }

  selectAll(){
    const cantieriToggle = this.cantieriFilterService.toggleSelectAllCantieri(this.allSelected, );

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

  togglePlates(){
    this.mapService.togglePopups$.next();
  }

  public get filters(): Filters {
    return this._filters;
  }
  public set filters(value: Filters) {
    this._filters = value;
  }
}
