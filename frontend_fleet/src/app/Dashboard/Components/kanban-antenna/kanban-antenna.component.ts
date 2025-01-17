import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
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
import { VehicleData } from '../../../Models/VehicleData';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { AntennaFilterService } from '../../../Common-services/antenna-filter/antenna-filter.service';
import { AntennaGraphService } from '../../Services/antenna-graph/antenna-graph.service';
import { CheckErrorsService } from '../../../Common-services/check-errors/check-errors.service';

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
    MatTooltipModule
  ],
  templateUrl: './kanban-antenna.component.html',
  styleUrl: './kanban-antenna.component.css'
})
export class KanbanAntennaComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();

  constructor(
    public kanbanAntennaService: KanbanAntennaService,
    private filtersCommonService: FiltersCommonService,
    private sessionStorageService: SessionStorageService,
    private antenanGraphService: AntennaGraphService,
    public checkErrorsService: CheckErrorsService,
    private cd: ChangeDetectorRef
  ){}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    const allData: VehicleData[] = JSON.parse(this.sessionStorageService.getItem("allData"));
    let kanbanVehicles = allData;

    this.filtersCommonService.applyFilters$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe((filters: Filters)=>{
      kanbanVehicles = this.filtersCommonService.applyAllFiltersOnVehicles(allData, filters);
      this.kanbanAntennaService.setKanbanData(kanbanVehicles);
      this.antenanGraphService.loadChartData$.next(kanbanVehicles);
    });
    this.kanbanAntennaService.setKanbanData(kanbanVehicles);
  }
}
