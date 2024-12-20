import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatListModule} from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { MatButtonModule } from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { CheckErrorsService } from '../../Services/check-errors/check-errors.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { Vehicle } from '../../../Models/Vehicle';

@Component({
  selector: 'app-kanban-gps',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatListModule
  ],
  templateUrl: './kanban-gps.component.html',
  styleUrl: './kanban-gps.component.css'
})
export class KanbanGpsComponent implements AfterViewInit{
  constructor(
    public kanbanGpsService: KanbanGpsService,
    private sessionStorageService: SessionStorageService,
    private checkErrorsService: CheckErrorsService
  ){}

  ngAfterViewInit(): void {
    this.addVehiclesGpsData();
  }

  addVehiclesGpsData(){
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    const series = this.checkErrorsService.checkGpsErrorsAll(allVehicles);//recupero dati dei veicoli controllati
    console.log("series: ", series);
    //aggiunta veicoli funzionanti
    series[0].forEach(vehicle => {
      this.addItem("working", vehicle);
    });
    //aggiunta veicoli con warning
    series[1].forEach(vehicle => {
      this.addItem("warning", vehicle);
    });
    console.log(this.kanbanGpsService.workingVehicles);
  }

  addItem(column: 'working' | 'warning' | 'error', vehicle: Vehicle) {
    this.kanbanGpsService.addVehicle(column, vehicle);
  }

  // removeItem(column: 'working' | 'warning' | 'error', item: string) {
  //   this.kanbanGpsService.removeItem(column, item);
  // }
}
