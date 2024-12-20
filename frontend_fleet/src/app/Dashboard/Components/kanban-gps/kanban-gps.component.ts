import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MatListModule} from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { KanbanGpsService } from '../../Services/kanban-gps/kanban-gps.service';
import { MatButtonModule } from '@angular/material/button';
import {MatProgressBarModule} from '@angular/material/progress-bar';

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
export class KanbanGpsComponent {
  workingItems: string[] = [];
  warningItems: string[] = [];
  errorItems: string[] = [];

  newWorkingItem: string = '';
  newWarningItem: string = '';
  newErrorItem: string = '';

  constructor(public kanbanGpsService: KanbanGpsService){}

  addItem(column: 'working' | 'warning' | 'error') {
    this.kanbanGpsService.addItem(column);
  }

  removeItem(column: 'working' | 'warning' | 'error', item: string) {
    this.kanbanGpsService.removeItem(column, item);
  }
}
