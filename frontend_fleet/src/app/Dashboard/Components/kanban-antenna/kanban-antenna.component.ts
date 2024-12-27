import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { KanbanFiltersComponent } from '../kanban-filters/kanban-filters.component';
import { KanbanAntennaService } from '../../Services/kanban-antenna/kanban-antenna.service';

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
export class KanbanAntennaComponent {
  constructor(
    public kanbanAntennaService: KanbanAntennaService
  ){}
}
