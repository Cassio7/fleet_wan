import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
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
import { MapService, pathData } from '../../../Common-services/map/map.service';
import { skip, Subject, takeUntil, map, filter } from 'rxjs';
import { RealtimeData } from '../../../Models/RealtimeData';
import { CommonModule } from '@angular/common';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { Point } from '../../../Models/Point';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-storico-mezzi',
  standalone: true,
  imports: [
    CommonModule,
    MapComponent,
    MatFormFieldModule,
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
export class StoricoMezziComponent implements OnInit, AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  private _selectedVehicle!: Vehicle;
  private _positionPlate: string = "";
  private _pathPlate: string = "";

  linedPath: boolean = true;
  pathTypeText: string = "Fedele";

  isSmallScreen: boolean = false;

  constructor(
    private mapService: MapService,
    private sessionStorageService: SessionStorageService,
    private breakPointObserver: BreakpointObserver,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.breakPointObserver.observe([
      Breakpoints.Large
    ]).subscribe(result => {
      if (result.matches) {
        this.isSmallScreen = true;
      }
    });
  }

  ngAfterViewInit(): void {
    this.handlePositionLoading();
    this.handleDayPathLoading();
    this.handleSessionPathLoading();

    this.mapService.initMap$.next({point: this.mapService.defaultPoint, zoom: this.mapService.defaultZoom + 1});
  }

  private handlePositionLoading(){
    this.mapService.loadPosition$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (realtimeData: RealtimeData | null) => {
        if(realtimeData) {
          this.positionPlate = realtimeData?.vehicle.plate;
          this.pathPlate = "";

          console.log("load position arivatia");
          console.log('positonPlate: ', this.positionPlate);
          console.log('pathPlate: ', this.pathPlate);
        }
        this.cd.detectChanges();
      }
    });
  }

  private handleDayPathLoading(){
    this.mapService.loadDayPath$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (pathData: pathData) => {
        this.pathPlate = pathData.plate;
        this.positionPlate = "";
        this.cd.detectChanges();
      },
    });
  }

  private handleSessionPathLoading(){
    this.mapService.loadSessionPath$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (pathData: pathData) => {
        this.pathPlate = pathData.plate;
        this.positionPlate = "";
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

    let pathData: pathData = JSON.parse(this.sessionStorageService.getItem("pathData"));
    const pathType = this.mapService.pathType();

    console.log("path type: ", pathType);

    if(pathData){
      //trasformazione oggetti {_lat, _long} in Point
      pathData.points = pathData.points.map((point: any) => new Point(point._lat, point._long));
      if(pathData?.firstPoints){
        pathData.firstPoints = pathData.firstPoints.map((point: any) => new Point(point._lat, point._long));
      }
      if(pathData?.tagPoints){
        pathData.tagPoints = pathData.tagPoints.map((point: any) => new Point(point._lat, point._long));
      }

      if(pathType == "day"){
        this.mapService.loadDayPath$.next(pathData);
      }else if(pathType == "session"){
        this.mapService.loadSessionPath$.next(pathData);
      }
    }

  }

  public get pathPlate(): string {
    return this._pathPlate;
  }
  public set pathPlate(value: string) {
    this._pathPlate = value;
  }
  public get positionPlate(): string {
    return this._positionPlate;
  }
  public set positionPlate(value: string) {
    this._positionPlate = value;
  }
  public get selectedVehicle(): Vehicle {
    return this._selectedVehicle;
  }
  public set selectedVehicle(value: Vehicle) {
    this._selectedVehicle = value;
  }
}
