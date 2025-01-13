import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatListModule} from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { MatButtonModule } from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { SessionStorageService } from '../../../Common-services/sessionStorage/session-storage.service';
import { KanbanFiltersComponent } from "../kanban-filters/kanban-filters.component";
import { skip, Subject, takeUntil } from 'rxjs';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';
import { Filters, FiltersCommonService } from '../../../Common-services/filters-common/filters-common.service';
import { VehicleData } from '../../../Models/VehicleData';
import { GpsFilterService } from '../../../Common-services/gps-filter/gps-filter.service';
import { GpsGraphService } from '../../Services/gps-graph/gps-graph.service';

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
export class KanbanGpsComponent implements AfterViewInit, OnDestroy{
  private readonly destroy$: Subject<void> = new Subject<void>();
  constructor(
    public kanbanGpsService: KanbanGpsService,
    private plateFilterService: PlateFilterService,
    private filtersCommonService: FiltersCommonService,
    private sessionStorageService: SessionStorageService,
    private gpsGraphService: GpsGraphService,
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
      this.kanbanGpsService.setKanbanData(kanbanVehicles);
      this.gpsGraphService.loadChartData$.next(kanbanVehicles);
    });
    this.kanbanGpsService.setKanbanData(kanbanVehicles);
  }
}
