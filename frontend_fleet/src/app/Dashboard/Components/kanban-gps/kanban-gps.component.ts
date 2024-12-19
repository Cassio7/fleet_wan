import { Component } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kanban-gps',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule
  ],
  templateUrl: './kanban-gps.component.html',
  styleUrl: './kanban-gps.component.css'
})
export class KanbanGpsComponent {

}
