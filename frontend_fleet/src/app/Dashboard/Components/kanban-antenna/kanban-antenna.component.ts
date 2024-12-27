import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { KanbanFiltersComponent } from '../kanban-filters/kanban-filters.component';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';
import { takeUntil, skip, Subject } from 'rxjs';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { Vehicle } from '../../../Models/Vehicle';
import { CheckErrorsService } from '../../Services/check-errors/check-errors.service';
import { BlackboxGraphsService } from '../../Services/blackbox-graphs/blackbox-graphs.service';

@Component({
  selector: 'app-kanban-antenna',
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
  templateUrl: './kanban-antenna.component.html',
  styleUrl: './kanban-antenna.component.css'
})
export class KanbanAntennaComponent implements AfterViewInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  constructor(
    public kanbanAntennaService: KanbanAntennaService,
    private plateFilterService: PlateFilterService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef
  ){}

  ngAfterViewInit(): void {
    const allVehicles = JSON.parse(this.sessionStorageService.getItem("allVehicles"));
    let kanbanVehicles = allVehicles;
    this.kanbanAntennaService.loadKanbanAntennaVehicles$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (vehicles: Vehicle[]) => {
        this.kanbanAntennaService.setKanbanData(vehicles);
      },
      error: error => console.error("Errore nel caricamento del kanban antenna: ", error)
    });
    this.plateFilterService.filterByPlateResearch$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (research: string) => {
        kanbanVehicles = allVehicles;
        kanbanVehicles = this.plateFilterService.filterVehiclesByPlateResearch(research, kanbanVehicles);
        this.kanbanAntennaService.setKanbanData(kanbanVehicles);
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nel filtro delle targhe: ", error)
    });
    this.kanbanAntennaService.setKanbanData(kanbanVehicles);
  }
}
