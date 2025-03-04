import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MapComponent } from "../../../Common-components/map/map.component";
import { SessionTableComponent } from "../../../Common-components/session-table/session-table.component";
import { ListaMezziComponent } from "../lista-mezzi/lista-mezzi.component";
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SessionFiltersComponent } from "../../../Common-components/session-filters/session-filters.component";
import { ListaFiltersComponent } from "../lista-filters/lista-filters.component";
import { Vehicle } from '../../../Models/Vehicle';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MapService } from '../../../Common-services/map/map.service';
import { skip, Subject, takeUntil, map, filter } from 'rxjs';
import { RealtimeData } from '../../../Models/RealtimeData';
import { CommonModule } from '@angular/common';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { Point } from '../../../Models/Point';

@Component({
  selector: 'app-storico-mezzi',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    ListaMezziComponent,
    MatListModule,
    MatCardModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatSlideToggleModule,
    SessionFiltersComponent,
    ListaFiltersComponent,
    SessionTableComponent
],
  templateUrl: './storico-mezzi.component.html',
  styleUrl: './storico-mezzi.component.css'
})
export class StoricoMezziComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();
  private _selectedVehicle!: Vehicle;

  linedPath: boolean = false;
  isPathLoaded: boolean = false;
  pathTypeText: string = "Ricostruito";

  constructor(
    private mapService: MapService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
    this.handleDayPathLoading();
    this.handleSessionPathLoading();
  }

  private handleDayPathLoading(){
    this.mapService.loadDayPath$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: () => {
        this.isPathLoaded = true;
        this.cd.detectChanges();
      },
    });
  }

  private handleSessionPathLoading(){
    this.mapService.loadSessionPath$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: () => {
        this.isPathLoaded = true;
        this.cd.detectChanges();
      },
    });
  }

  onVehicleSelection(vehicle: Vehicle){
    this.selectedVehicle = vehicle;
    this.cd.detectChanges();
    console.log("veicolo arrivato a padre: ", vehicle);
  }

  togglePathType(){
    if(this.mapService.pathMode() == "routed"){
      this.mapService.pathMode.set("polyline");
      this.pathTypeText = "Fedele";
    }else if(this.mapService.pathMode() == "polyline"){
      this.mapService.pathMode.set("routed");
      this.pathTypeText = "Ricostruito";
    }

    let pathData = JSON.parse(this.sessionStorageService.getItem("pathData"));
    const pathType = this.mapService.pathType();

    console.log("path type: ", pathType);

    if(pathData){
      //trasformazioni oggetti {_lat, _long} in Point
      pathData.points = pathData.points.map((point: any) => new Point(point._lat, point._long));
      if(pathData?.firstPoints){
        pathData.firstPoints = pathData.firstPoints.map((point: any) => new Point(point._lat, point._long));
      }

      if(pathType == "day"){
        this.mapService.loadDayPath$.next(pathData);
      }else if(pathType == "session"){
        this.mapService.loadSessionPath$.next(pathData);
      }
    }

  }

  public get selectedVehicle(): Vehicle {
    return this._selectedVehicle;
  }
  public set selectedVehicle(value: Vehicle) {
    this._selectedVehicle = value;
  }
}
