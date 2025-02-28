import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MapComponent } from "../../../Common-components/map/map.component";
import { SessionHystoriesComponent } from "../../../Common-components/Scheda-mezzo/session-hystories/session-hystories.component";
import { SessionTableComponent } from "../../../Common-components/Scheda-mezzo/session-table/session-table.component";
import { ListaMezziComponent } from "../lista-mezzi/lista-mezzi.component";
import { FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SessionApiService } from '../../../Common-services/session/session-api.service';
import { SessionFiltersComponent } from "../../../Common-components/Scheda-mezzo/session-filters/session-filters.component";
import { ListaFiltersComponent } from "../lista-filters/lista-filters.component";
import { Vehicle } from '../../../Models/Vehicle';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MapService } from '../../../Common-services/map/map.service';
import { skip, Subject, takeUntil } from 'rxjs';
import { RealtimeData } from '../../../Models/RealtimeData';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-storico-mezzi',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    SessionHystoriesComponent,
    ListaMezziComponent,
    MatListModule,
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule,
    SessionFiltersComponent,
    ListaFiltersComponent
],
  templateUrl: './storico-mezzi.component.html',
  styleUrl: './storico-mezzi.component.css'
})
export class StoricoMezziComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();
  private _selectedVehicle!: Vehicle;

  linedPath: boolean = false;
  isMapLoaded: boolean = false;

  constructor(
    private mapService: MapService,
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
    this.handleMapInit();
  }

  private handleMapInit(){
    this.mapService.initMap$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: () => {
        this.isMapLoaded = true;
      },
    });
  }

  onVehicleSelection(vehicle: Vehicle){
    this.selectedVehicle = vehicle;
    this.cd.detectChanges();
    console.log("veicolo arrivato a padre: ", vehicle);
  }

  togglePathType(){

  }

  public get selectedVehicle(): Vehicle {
    return this._selectedVehicle;
  }
  public set selectedVehicle(value: Vehicle) {
    this._selectedVehicle = value;
  }
}
