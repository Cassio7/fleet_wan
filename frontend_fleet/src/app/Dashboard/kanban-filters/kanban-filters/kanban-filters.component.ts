import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { PlateFilterService } from '../../../Common-services/plate-filter/plate-filter.service';

@Component({
  selector: 'app-kanban-filters',
  standalone: true,
  imports: [
    MatFormFieldModule,
    CommonModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    FormsModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './kanban-filters.component.html',
  styleUrl: './kanban-filters.component.css'
})
export class KanbanFiltersComponent{
  plate: string = "";

  constructor(
    private plateFilterService: PlateFilterService
  ){}

  searchPlates(){
    this.plateFilterService.filterByPlateResearch$.next(this.plate);
  }
}
