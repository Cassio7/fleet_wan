import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MapComponent } from "../../../Common-components/map/map.component";
import { SessionHystoriesComponent } from "../../../Common-components/Scheda-mezzo/session-hystories/session-hystories.component";
import { SessionTableComponent } from "../../../Common-components/Scheda-mezzo/session-table/session-table.component";
import { ListaMezziComponent } from "../lista-mezzi/lista-mezzi.component";
import { FormGroup, FormControl } from '@angular/forms';
import { SessionApiService } from '../../../Common-services/session/session-api.service';
import { SessionFiltersComponent } from "../../../Common-components/Scheda-mezzo/session-filters/session-filters.component";
import { ListaFiltersComponent } from "../lista-filters/lista-filters.component";
import { Vehicle } from '../../../Models/Vehicle';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-storico-mezzi',
  standalone: true,
  imports: [
    MapComponent,
    SessionHystoriesComponent,
    ListaMezziComponent,
    ListaFiltersComponent,
    MatListModule,
    MatCardModule,
    MatIconModule,
    SessionFiltersComponent
],
  templateUrl: './storico-mezzi.component.html',
  styleUrl: './storico-mezzi.component.css'
})
export class StoricoMezziComponent{
  private _selectedVehicle!: Vehicle;

  constructor(private cd: ChangeDetectorRef){}

  onVehicleSelection(vehicle: Vehicle){
    this.selectedVehicle = vehicle;
    this.cd.detectChanges();
    console.log("veicolo arrivato a padre: ", vehicle);
  }

  public get selectedVehicle(): Vehicle {
    return this._selectedVehicle;
  }
  public set selectedVehicle(value: Vehicle) {
    this._selectedVehicle = value;
  }
}
