import { WorkSite } from './../../../Models/Worksite';
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
import { Observable, of, skip, Subject, takeUntil, tap } from 'rxjs';
import { RealtimeData } from '../../../Models/RealtimeData';
import { VehiclesApiService } from '../../../Common-services/vehicles api service/vehicles-api.service';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { Vehicle } from '../../../Models/Vehicle';

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
  private mapVehicles: {veId: number, plate: string, worksite?: WorkSite}[] = [];

  plate: string = "";

  targhe = new FormControl<string[]>([]);
  cantieri = new FormControl<string[]>([]);

  listaCantieri: string[] = [];
  listaTarghe: string[] = [];

  checked = true;
  disabled = false;
  private allSelected: boolean = false;

  constructor(
    private cantieriFilterService: CantieriFilterService,
    private plateFilterService: PlateFilterService,
    private sessionStorageService: SessionStorageService,
    private mapService: MapService,
    private vehiclesApiService: VehiclesApiService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.handleLoadPosition();
  }

  private handleLoadPosition(){
    this.mapService.loadPosition$.pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (realtimeData: RealtimeData | null) => {
        if(realtimeData){
          this.mapVehicles.push(realtimeData.vehicle);
          const vehicle: {plate: string, veId: number, worksite?: WorkSite} = realtimeData.vehicle;
          let selectedTarghe = this.targhe.value;
          this.listaTarghe.push(vehicle.plate);
          if(selectedTarghe) this.targhe.setValue(["Seleziona tutto", ...selectedTarghe, vehicle.plate]);

          if(vehicle?.worksite && !this.listaCantieri.includes(vehicle.worksite.name)){
            let selectedCantieri = this.cantieri.value;
            this.listaCantieri.push(vehicle.worksite.name);
            if(selectedCantieri) this.cantieri.setValue(["Seleziona tutto", ...selectedCantieri, vehicle.worksite.name]);
          }
          this.cd.detectChanges();
        }
      },
      error: error => console.error("Errore nel caricamento del veicolo nel filtro: ", error)
    });
  }

  selectAll(){
    const cantieriToggle = this.cantieriFilterService.toggleSelectAllCantieri(this.allSelected);

    this.cantieri.setValue(cantieriToggle.length > 0 ? ["Seleziona tutto", ...cantieriToggle] : cantieriToggle);
    this.allSelected = !this.allSelected;
    this.cd.detectChanges();
  }

  selectCantiere() {
    this.getAvailableVehicles().pipe(takeUntil(this.destroy$)).subscribe({
      next: (vehicles: Vehicle[]) => {
        let allCantieri: string[] = this.cantieriFilterService.vehiclesCantieriOnce(vehicles);

        const selectedCantieri = this.cantieri.value?.filter(option => option !== "Seleziona tutto");
        if (selectedCantieri) {
          if (JSON.stringify(allCantieri.sort()) === JSON.stringify(selectedCantieri.sort())) {
            this.allSelected = true;
            this.cantieri.setValue(["Seleziona tutto", ...allCantieri]);
          } else {
            this.allSelected = false;
            this.cantieri.setValue(selectedCantieri);
          }
        }
      },
      error: error => console.error("Errore nella richiesta per ottenere tutti i veicoli: ", error)
    });
  }


  private getAvailableVehicles(): Observable<any[]> {
    const allData = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    let vehicles = allData || allVehicles;

    if (vehicles) {
      return of(vehicles); // Return cached data as an Observable
    } else {
      return this.vehiclesApiService.getAllVehicles().pipe(
        takeUntil(this.destroy$),
        tap((fetchedVehicles: Vehicle[]) => {
          this.sessionStorageService.setItem("allVehicles", JSON.stringify(fetchedVehicles));
        })
      );
    }
  }

  updateData(){
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    const plateFilteredVehicles: Vehicle[] = this.targhe.value ? this.plateFilterService.filterVehiclesByPlates(this.targhe.value, allVehicles as Vehicle[]) as Vehicle[] : [];
    const cantieriFilteredVehicles: Vehicle[] = this.cantieri.value ? this.cantieriFilterService.filterVehiclesByCantieri(allVehicles as Vehicle[], this.cantieri.value) as Vehicle[] : [];

    const commonVehicles = plateFilteredVehicles.filter(plateVehicle =>
      cantieriFilteredVehicles.some(cantieriVehicle => cantieriVehicle.veId === plateVehicle.veId)
    );

    this.mapVehicles = commonVehicles;
    this.listaTarghe = commonVehicles.map(vehicle => vehicle.plate);


    const commonPlates = commonVehicles.map(vehicle => vehicle.plate);
    this.mapService.updateMarkers$.next(commonPlates);
  }

  togglePlates(){
    this.mapService.togglePopups$.next();
  }
}
