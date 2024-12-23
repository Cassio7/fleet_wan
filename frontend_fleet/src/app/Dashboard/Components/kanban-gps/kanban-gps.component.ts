import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
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
import { KanbanFiltersComponent } from "../../kanban-filters/kanban-filters/kanban-filters.component";
import { FilterService } from '../../../Common-services/filter/filter.service';
import { skip, Subject, takeUntil } from 'rxjs';

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
    MatListModule,
    KanbanFiltersComponent
],
  templateUrl: './kanban-gps.component.html',
  styleUrl: './kanban-gps.component.css'
})
export class KanbanGpsComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  constructor(
    public kanbanGpsService: KanbanGpsService,
    private filterService: FilterService,
    private sessionStorageService: SessionStorageService,
    private checkErrorsService: CheckErrorsService,
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    let kanbanVehicles = allVehicles;
    this.filterService.filterByPlateResearch$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (research: string) => {
        kanbanVehicles = allVehicles;
        kanbanVehicles = this.filterService.filterVehiclesByPlateResearch(research, kanbanVehicles);
        this.setKanbanData(kanbanVehicles);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel filtro delle targhe: ", error)
    });
    this.setKanbanData(kanbanVehicles);
  }

  setKanbanData(vehicles: Vehicle[]){
    const series = this.checkErrorsService.checkGpsErrorsAll(vehicles);//recupero dati dei veicoli controllati
    this.kanbanGpsService.clearVehicles();
    //aggiunta veicoli funzionanti
    series[0].forEach(vehicle => {
      this.addItem("working", vehicle);
    });
    //aggiunta veicoli con warning
    series[1].forEach(vehicle => {
      this.addItem("warning", vehicle);
    });
  }

  addItem(column: 'working' | 'warning' | 'error', vehicle: Vehicle) {
    this.kanbanGpsService.addVehicle(column, vehicle);
  }

  // removeItem(column: 'working' | 'warning' | 'error', item: string) {
  //   this.kanbanGpsService.removeItem(column, item);
  // }
}
